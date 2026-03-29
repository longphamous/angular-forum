import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, Signal, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, tap } from "rxjs";

import { AUTH_ROUTES } from "../../core/api/auth.routes";
import { USER_ROUTES } from "../../core/api/user.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { AuthSession, LoginResponse, UserProfile } from "../../core/models/user/user";
import { PushService } from "../../core/services/push.service";

const STORAGE_TOKEN = "aniverse_access_token";
const STORAGE_REFRESH = "aniverse_refresh_token";
const STORAGE_PROFILE = "aniverse_user_profile";
const STORAGE_REMEMBER_ME = "aniverse_remember_me";

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    displayName?: string;
}

export interface UpdateProfilePayload {
    avatarUrl?: string;
    coverUrl?: string;
    bio?: string;
    birthday?: string;
    displayName?: string;
    gender?: string;
    location?: string;
    website?: string;
    signature?: string;
}

export interface ChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}

@Injectable({ providedIn: "root" })
export class AuthFacade {
    readonly currentUser: Signal<UserProfile | null>;
    readonly isAuthenticated: Signal<boolean>;
    readonly isAdmin: Signal<boolean>;
    readonly isModerator: Signal<boolean>;

    private readonly _currentUser = signal<UserProfile | null>(null);
    private readonly _accessToken = signal<string | null>(null);
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly pushService = inject(PushService);

    constructor() {
        this.currentUser = this._currentUser.asReadonly();
        this.isAuthenticated = computed(() => this._currentUser() !== null && this._accessToken() !== null);
        this.isAdmin = computed(() => this._currentUser()?.role === "admin");
        this.isModerator = computed(
            () => this._currentUser()?.role === "admin" || this._currentUser()?.role === "moderator"
        );
        this._restoreFromStorage();
    }

    get accessToken(): string | null {
        return this._accessToken();
    }

    get rememberMe(): boolean {
        return localStorage.getItem(STORAGE_REMEMBER_ME) === "true";
    }

    login(username: string, password: string, rememberMe = false): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(`${this.apiConfig.baseUrl}${AUTH_ROUTES.login()}`, {
                username,
                password,
                rememberMe
            })
            .pipe(tap((res) => this._persist(res.session, res.profile, rememberMe)));
    }

    register(payload: RegisterPayload): Observable<UserProfile> {
        return this.http.post<UserProfile>(`${this.apiConfig.baseUrl}${AUTH_ROUTES.register()}`, payload);
    }

    refreshToken(): Observable<AuthSession> {
        const storage = this.rememberMe ? localStorage : sessionStorage;
        const refreshToken = storage.getItem(STORAGE_REFRESH);
        return this.http.post<AuthSession>(`${this.apiConfig.baseUrl}${AUTH_ROUTES.refresh()}`, { refreshToken }).pipe(
            tap((session) => {
                this._accessToken.set(session.accessToken);
                storage.setItem(STORAGE_TOKEN, session.accessToken);
                storage.setItem(STORAGE_REFRESH, session.refreshToken);
            })
        );
    }

    updateProfile(payload: UpdateProfilePayload): Observable<UserProfile> {
        return this.http.patch<UserProfile>(`${this.apiConfig.baseUrl}${USER_ROUTES.profile()}`, payload).pipe(
            tap((updated) => {
                this._currentUser.set(updated);
                const storage = this.rememberMe ? localStorage : sessionStorage;
                storage.setItem(STORAGE_PROFILE, JSON.stringify(updated));
            })
        );
    }

    changePassword(payload: ChangePasswordPayload): Observable<void> {
        return this.http.post<void>(`${this.apiConfig.baseUrl}${USER_ROUTES.changePassword()}`, payload);
    }

    logout(): void {
        this.clearTokens();
        this.router.navigate(["/login"]);
    }

    /** Remove all auth tokens from memory and storage without navigating. */
    clearTokens(): void {
        this.pushService.disconnect();
        this._accessToken.set(null);
        this._currentUser.set(null);
        for (const storage of [localStorage, sessionStorage]) {
            storage.removeItem(STORAGE_TOKEN);
            storage.removeItem(STORAGE_REFRESH);
            storage.removeItem(STORAGE_PROFILE);
        }
        localStorage.removeItem(STORAGE_REMEMBER_ME);
    }

    private _persist(session: AuthSession, profile: UserProfile, rememberMe = false): void {
        this._accessToken.set(session.accessToken);
        this._currentUser.set(profile);

        localStorage.setItem(STORAGE_REMEMBER_ME, String(rememberMe));
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem(STORAGE_TOKEN, session.accessToken);
        storage.setItem(STORAGE_REFRESH, session.refreshToken);
        storage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
        this.pushService.connect(session.accessToken);
    }

    private _restoreFromStorage(): void {
        const storage = this.rememberMe ? localStorage : sessionStorage;
        const token = storage.getItem(STORAGE_TOKEN);
        const refreshToken = storage.getItem(STORAGE_REFRESH);
        const raw = storage.getItem(STORAGE_PROFILE);
        if (!token || !raw) return;

        let profile: UserProfile;
        try {
            profile = JSON.parse(raw) as UserProfile;
        } catch {
            this._clearStorage();
            return;
        }

        // Token is still valid — restore session immediately
        if (!this._isTokenExpired(token)) {
            this._accessToken.set(token);
            this._currentUser.set(profile);
            this.pushService.connect(token);

            // Proactively refresh if token expires within 5 minutes
            if (this._tokenExpiresWithin(token, 5 * 60)) {
                this._silentRefresh(storage, profile);
            }
            return;
        }

        // Token expired — attempt refresh before restoring user state
        if (refreshToken) {
            this._silentRefresh(storage, profile);
        } else {
            this._clearStorage();
        }
    }

    /** Attempt silent token refresh. Only sets user state on success. */
    private _silentRefresh(storage: Storage, profile: UserProfile): void {
        const refreshToken = storage.getItem(STORAGE_REFRESH);
        if (!refreshToken) {
            this._clearStorage();
            return;
        }

        this.http.post<AuthSession>(`${this.apiConfig.baseUrl}${AUTH_ROUTES.refresh()}`, { refreshToken }).subscribe({
            next: (session) => {
                this._accessToken.set(session.accessToken);
                this._currentUser.set(profile);
                storage.setItem(STORAGE_TOKEN, session.accessToken);
                storage.setItem(STORAGE_REFRESH, session.refreshToken);
                this.pushService.connect(session.accessToken);
            },
            error: () => {
                // Refresh failed — session is truly expired
                this._clearStorage();
            }
        });
    }

    /** Check if token expires within the given seconds. */
    private _tokenExpiresWithin(token: string, seconds: number): boolean {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const exp = payload.exp as number | undefined;
            if (!exp) return false;
            return exp * 1000 - Date.now() < seconds * 1000;
        } catch {
            return true;
        }
    }

    private _isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const exp = payload.exp as number | undefined;
            if (!exp) return false;
            return Date.now() >= exp * 1000;
        } catch {
            return true;
        }
    }

    private _clearStorage(): void {
        this._accessToken.set(null);
        this._currentUser.set(null);
        for (const storage of [localStorage, sessionStorage]) {
            storage.removeItem(STORAGE_TOKEN);
            storage.removeItem(STORAGE_REFRESH);
            storage.removeItem(STORAGE_PROFILE);
        }
        localStorage.removeItem(STORAGE_REMEMBER_ME);
    }
}
