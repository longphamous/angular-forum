import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, switchMap, throwError } from "rxjs";

import { AuthFacade } from "../../facade/auth/auth-facade";
import { SessionService } from "../services/session.service";

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authFacade = inject(AuthFacade);
    const sessionService = inject(SessionService);
    const token = authFacade.accessToken;

    if (!token) return next(req);

    const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

    // Track activity on every request
    sessionService.updateLastActivity();

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status !== 401 || req.url.includes("/auth/") || req.url.includes("/login") || req.url.includes("/refresh")) {
                return throwError(() => error);
            }

            // Try refresh token once
            if (!isRefreshing) {
                isRefreshing = true;
                return authFacade.refreshToken().pipe(
                    switchMap((session) => {
                        isRefreshing = false;
                        const retryReq = req.clone({
                            setHeaders: { Authorization: `Bearer ${session.accessToken}` }
                        });
                        return next(retryReq);
                    }),
                    catchError((refreshError) => {
                        isRefreshing = false;
                        // Refresh failed — session expired
                        sessionService.sessionExpired.set(true);
                        sessionService.sessionExpiredReason.set("token");
                        return throwError(() => refreshError);
                    })
                );
            }

            return throwError(() => error);
        })
    );
};
