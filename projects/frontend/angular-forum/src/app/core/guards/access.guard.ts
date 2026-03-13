import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import { AuthFacade } from "../../facade/auth/auth-facade";

/**
 * Group-based access guard.
 *
 * Route data: `{ requiredGroups: string[] }`
 *
 * Special group names:
 *  - "Jeder"                → always allowed (no auth required)
 *  - "Gast"                 → only non-authenticated users
 *  - "Registrierte Benutzer"→ any authenticated user
 *  - "Moderator"            → role admin or moderator
 *  - "Admin"                → role admin only
 *  - any other name         → user must be in that group
 *
 * If requiredGroups is empty, access is granted (same as "Jeder").
 */
export const accessGuard: CanActivateFn = (route) => {
    const authFacade = inject(AuthFacade);
    const router = inject(Router);

    const requiredGroups: string[] = (route.data?.["requiredGroups"] as string[] | undefined) ?? [];

    // No restriction or everyone allowed
    if (requiredGroups.length === 0 || requiredGroups.includes("Jeder")) {
        return true;
    }

    // Guest-only: allow only non-authenticated
    if (requiredGroups.every((g) => g === "Gast")) {
        return !authFacade.isAuthenticated() || router.createUrlTree(["/dashboard"]);
    }

    // All remaining groups require authentication
    if (!authFacade.isAuthenticated()) {
        return router.createUrlTree(["/login"]);
    }

    const user = authFacade.currentUser();
    if (!user) {
        return router.createUrlTree(["/login"]);
    }

    // Admin role → Admin group
    if (requiredGroups.includes("Admin")) {
        return authFacade.isAdmin() || router.createUrlTree(["/dashboard"]);
    }

    // Moderator group → moderator or admin role
    if (requiredGroups.includes("Moderator")) {
        return authFacade.isModerator() || router.createUrlTree(["/dashboard"]);
    }

    // Registered users (any authenticated)
    if (requiredGroups.includes("Registrierte Benutzer")) {
        return true;
    }

    // Custom group: check user's groups array
    const userGroups: string[] = user.groups ?? [];
    const hasGroup = requiredGroups.some((g) => userGroups.includes(g));
    return hasGroup || router.createUrlTree(["/dashboard"]);
};
