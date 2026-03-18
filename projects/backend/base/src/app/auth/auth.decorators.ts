import { SetMetadata } from "@nestjs/common";

import { UserRole } from "../user/models/user.model";

/** Mark a route/controller as publicly accessible (no JWT required). */
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Restrict a route/controller to one or more roles. */
export const ROLES_KEY = "roles";
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
