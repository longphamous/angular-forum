import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { AuthFacade } from "../../facade/auth/auth-facade";

export const authGuard: CanActivateFn = () => {
    const authFacade = inject(AuthFacade);
    const router = inject(Router);

    if (authFacade.isAuthenticated()) {
        return true;
    }

    return router.createUrlTree(["/login"]);
};

export const adminGuard: CanActivateFn = () => {
    const authFacade = inject(AuthFacade);
    const router = inject(Router);

    if (authFacade.isAdmin()) {
        return true;
    }

    return router.createUrlTree(["/dashboard"]);
};
