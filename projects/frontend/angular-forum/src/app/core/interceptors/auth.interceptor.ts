import { HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from "rxjs";

import { AuthFacade } from "../../facade/auth/auth-facade";
import { SessionService } from "../services/session.service";

let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<boolean>(false);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn) => {
    const authFacade = inject(AuthFacade);
    const sessionService = inject(SessionService);

    // Skip auth header for login/register/refresh requests
    if (req.url.includes("/auth/") || req.url.includes("/login") || req.url.includes("/refresh")) {
        return next(req);
    }

    const token = authFacade.accessToken;
    if (!token) return next(req);

    const authReq = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

    // Track activity on every request
    sessionService.updateLastActivity();

    return next(authReq).pipe(
        catchError((error: HttpErrorResponse) => {
            if (error.status !== 401) {
                return throwError(() => error);
            }

            // Try refresh token once; queue other requests until refresh completes
            if (!isRefreshing) {
                isRefreshing = true;
                refreshDone$.next(false);

                return authFacade.refreshToken().pipe(
                    switchMap((session) => {
                        isRefreshing = false;
                        refreshDone$.next(true);
                        sessionService.resetExpiredState();
                        const retryReq = req.clone({
                            setHeaders: { Authorization: `Bearer ${session.accessToken}` }
                        });
                        return next(retryReq);
                    }),
                    catchError((refreshError) => {
                        isRefreshing = false;
                        refreshDone$.next(true);
                        // Refresh failed — force logout with visible dialog
                        authFacade.clearTokens();
                        sessionService.sessionExpired.set(true);
                        sessionService.sessionExpiredReason.set("token");
                        return throwError(() => refreshError);
                    })
                );
            }

            // Another request triggered refresh — wait for it to finish, then retry
            return refreshDone$.pipe(
                filter((done) => done),
                take(1),
                switchMap(() => {
                    const newToken = authFacade.accessToken;
                    if (!newToken) return throwError(() => error);
                    const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
                    return next(retryReq);
                })
            );
        })
    );
};
