import { inject, Injectable, NgZone, signal } from "@angular/core";

import { AuthFacade } from "../../facade/auth/auth-facade";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS = 60 * 1000; // check every minute
const STORAGE_LAST_ACTIVITY = "aniverse_last_activity";

@Injectable({ providedIn: "root" })
export class SessionService {
    private readonly authFacade = inject(AuthFacade);
    private readonly ngZone = inject(NgZone);

    readonly sessionExpired = signal(false);
    readonly sessionExpiredReason = signal<"token" | "inactivity" | null>(null);

    private checkInterval: ReturnType<typeof setInterval> | null = null;
    private activityListeners: (() => void)[] = [];
    private refreshingFromCheck = false;

    start(): void {
        // Reset expired state on (re)start — e.g., after login
        this.sessionExpired.set(false);
        this.sessionExpiredReason.set(null);

        if (this.checkInterval) return;

        this.updateLastActivity();
        this.setupActivityTracking();

        this.ngZone.runOutsideAngular(() => {
            this.checkInterval = setInterval(() => this.checkSession(), CHECK_INTERVAL_MS);
        });
    }

    stop(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        this.removeActivityTracking();
        this.sessionExpired.set(false);
        this.sessionExpiredReason.set(null);
    }

    /** Call after successful login or token refresh to clear any expired state. */
    resetExpiredState(): void {
        this.sessionExpired.set(false);
        this.sessionExpiredReason.set(null);
    }

    updateLastActivity(): void {
        localStorage.setItem(STORAGE_LAST_ACTIVITY, Date.now().toString());
    }

    private checkSession(): void {
        if (!this.authFacade.isAuthenticated() || this.sessionExpired()) return;

        // Check token expiry — try refresh before showing dialog
        const token = this.authFacade.accessToken;
        if (token && this.isTokenExpired(token)) {
            this.ngZone.run(() => this.tryRefreshOrExpire("token"));
            return;
        }

        // Check inactivity
        const lastActivity = Number(localStorage.getItem(STORAGE_LAST_ACTIVITY) ?? 0);
        if (lastActivity > 0 && Date.now() - lastActivity > INACTIVITY_TIMEOUT_MS) {
            this.ngZone.run(() => this.handleExpired("inactivity"));
        }
    }

    /** Attempt token refresh; only show expired dialog if refresh fails. */
    private tryRefreshOrExpire(reason: "token"): void {
        if (this.refreshingFromCheck) return;
        this.refreshingFromCheck = true;

        this.authFacade.refreshToken().subscribe({
            next: () => {
                this.refreshingFromCheck = false;
                this.updateLastActivity();
            },
            error: () => {
                this.refreshingFromCheck = false;
                this.handleExpired(reason);
            }
        });
    }

    private handleExpired(reason: "token" | "inactivity"): void {
        this.sessionExpired.set(true);
        this.sessionExpiredReason.set(reason);
        // Actually clear the tokens so a page refresh doesn't restore the session
        this.authFacade.clearTokens();
    }

    confirmLogout(): void {
        this.stop();
        this.authFacade.logout();
    }

    private isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const exp = payload.exp as number | undefined;
            if (!exp) return false;
            return Date.now() >= (exp - 60) * 1000;
        } catch {
            return true;
        }
    }

    private setupActivityTracking(): void {
        const events = ["mousedown", "keydown", "scroll", "touchstart"];
        const handler = (): void => this.updateLastActivity();

        for (const event of events) {
            document.addEventListener(event, handler, { passive: true });
            this.activityListeners.push(() => document.removeEventListener(event, handler));
        }
    }

    private removeActivityTracking(): void {
        for (const remove of this.activityListeners) remove();
        this.activityListeners = [];
    }
}
