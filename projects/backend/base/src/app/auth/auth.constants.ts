/**
 * JWT secret key. Must be set via JWT_SECRET environment variable.
 * Falls back to a non-empty placeholder so the server can start,
 * but the JwtStrategy reads the actual secret from ConfigService.
 */
export const JWT_SECRET = process.env["JWT_SECRET"] || "UNSET_JWT_SECRET_PLEASE_CONFIGURE";

/** Access token lifetime */
export const JWT_EXPIRES_IN = "24h";

/** Refresh token lifetime */
export const JWT_REFRESH_EXPIRES_IN = "7d";
