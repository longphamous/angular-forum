export const STEAM_ROUTES = {
    link: () => "/steam/link",
    unlink: () => "/steam/link",
    profile: () => "/steam/profile",
    publicProfile: (userId: string) => `/steam/profile/${userId}`,
    sync: () => "/steam/sync",
    games: () => "/steam/games",
    recentGames: () => "/steam/games/recent",
    achievements: (appId: number) => `/steam/games/${appId}/achievements`,
    syncFriends: () => "/steam/sync-friends",
    settings: () => "/steam/settings",
    admin: {
        profiles: () => "/steam/admin/profiles",
        detail: (userId: string) => `/steam/admin/${userId}`
    }
} as const;
