import { HttpClient } from "@angular/common/http";
import { computed, inject, Injectable, Signal, signal } from "@angular/core";
import { Router } from "@angular/router";
import { Observable, tap } from "rxjs";

import { AUTH_ROUTES } from "../../core/api/auth.routes";
import { USER_ROUTES } from "../../core/api/user.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { AuthSession, LoginResponse, UserProfile } from "../../core/models/user/user";

const STORAGE_TOKEN = "aniverse_access_token";
const STORAGE_REFRESH = "aniverse_refresh_token";
const STORAGE_PROFILE = "aniverse_user_profile";

export interface RegisterPayload {
    username: string;
    email: string;
    password: string;
    displayName?: string;
}

export interface UpdateProfilePayload {
    avatarUrl?: string;
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

    login(username: string, password: string): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(`${this.apiConfig.baseUrl}${AUTH_ROUTES.login()}`, { username, password })
            .pipe(tap((res) => this._persist(res.session, res.profile)));
    }

    register(payload: RegisterPayload): Observable<UserProfile> {
        return this.http.post<UserProfile>(`${this.apiConfig.baseUrl}${AUTH_ROUTES.register()}`, payload);
    }

    refreshToken(): Observable<AuthSession> {
        const refreshToken = localStorage.getItem(STORAGE_REFRESH);
        return this.http.post<AuthSession>(`${this.apiConfig.baseUrl}${AUTH_ROUTES.refresh()}`, { refreshToken }).pipe(
            tap((session) => {
                this._accessToken.set(session.accessToken);
                localStorage.setItem(STORAGE_TOKEN, session.accessToken);
                localStorage.setItem(STORAGE_REFRESH, session.refreshToken);
            })
        );
    }

    updateProfile(payload: UpdateProfilePayload): Observable<UserProfile> {
        return this.http.patch<UserProfile>(`${this.apiConfig.baseUrl}${USER_ROUTES.profile()}`, payload).pipe(
            tap((updated) => {
                this._currentUser.set(updated);
                localStorage.setItem(STORAGE_PROFILE, JSON.stringify(updated));
            })
        );
    }

    changePassword(payload: ChangePasswordPayload): Observable<void> {
        return this.http.post<void>(`${this.apiConfig.baseUrl}${USER_ROUTES.changePassword()}`, payload);
    }

    logout(): void {
        this._accessToken.set(null);
        this._currentUser.set(null);
        localStorage.removeItem(STORAGE_TOKEN);
        localStorage.removeItem(STORAGE_REFRESH);
        localStorage.removeItem(STORAGE_PROFILE);
        this.router.navigate(["/login"]);
    }

    private _persist(session: AuthSession, profile: UserProfile): void {
        this._accessToken.set(session.accessToken);
        this._currentUser.set(profile);
        localStorage.setItem(STORAGE_TOKEN, session.accessToken);
        localStorage.setItem(STORAGE_REFRESH, session.refreshToken);
        localStorage.setItem(STORAGE_PROFILE, JSON.stringify(profile));
    }

    private _restoreFromStorage(): void {
        const token = localStorage.getItem(STORAGE_TOKEN);
        const raw = localStorage.getItem(STORAGE_PROFILE);
        if (!token || !raw) return;
        try {
            this._accessToken.set(token);
            this._currentUser.set(JSON.parse(raw) as UserProfile);
        } catch {
            localStorage.removeItem(STORAGE_TOKEN);
            localStorage.removeItem(STORAGE_REFRESH);
            localStorage.removeItem(STORAGE_PROFILE);
        }
    }
}
