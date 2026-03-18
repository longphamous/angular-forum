/**
 * JWT secret key.
 * In production this MUST come from an environment variable, e.g. process.env['JWT_SECRET']
 */
export const JWT_SECRET = process.env["JWT_SECRET"] ?? "";

/** Access token lifetime */
export const JWT_EXPIRES_IN = "24h";

/** Refresh token lifetime */
export const JWT_REFRESH_EXPIRES_IN = "7d";
