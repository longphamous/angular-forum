import { HttpClient } from "@angular/common/http";
import {
  inject,
  Injectable,
  Signal,
  signal,
  WritableSignal,
} from "@angular/core";
import { tap } from "rxjs/operators";

import { User } from "../../core/models/user/user";

/**
 * Shape of the authenticated user payload returned from the mock login endpoint.
 */
export interface AuthUser {
  token: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    roles: string[];
    reputation: number;
    joinedAt: string;
  };
}

interface LoginRequest {
  username: string;
  password: string;
}

@Injectable({ providedIn: "root" })
export class AuthFacade {
  // PUBLIC: exposed readonly signal and accessors
  readonly currentUser: Signal<User | null>;

  // PRIVATE: internal state (must come before getters to satisfy ordering rules)
  private readonly _currentUser: WritableSignal<AuthUser["user"] | null> =
    signal<AuthUser["user"] | null>(null);
  private _token: string | null = null;

  // HttpClient via inject (preferred over constructor injection)
  private readonly http = inject(HttpClient);

  constructor() {
    this.currentUser = this._currentUser.asReadonly();
  }

  get isAuthenticated(): boolean {
    return this._token !== null && this._currentUser() !== null;
  }

  get token(): string | null {
    return this._token;
  }

  /**
   * Attempts login via the mock /auth/login endpoint.
   * On success updates internal state (token + user).
   */
  login(username: string, password: string) {
    const payload: LoginRequest = { username, password };
    return this.http.post<AuthUser>("/auth/login", payload).pipe(
      tap({
        next: (res: AuthUser) => {
          this._token = res.token;
          this._currentUser.set(res.user);
          // optionally persist token/user in storage
        },
      }),
    );
  }

  /**
   * Clears authentication state.
   */
  logout(): void {
    this._token = null;
    this._currentUser.set(null);
  }
}
