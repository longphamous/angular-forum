export const GROUP_ROUTES = {
    list: () => "/group",
    detail: (id: string) => `/group/${id}`,
    users: (id: string) => `/group/${id}/users`,
    userInGroup: (id: string, userId: string) => `/group/${id}/users/${userId}`,
    userGroups: (userId: string) => `/group/user/${userId}/groups`
} as const;

export const PAGE_PERMISSION_ROUTES = {
    list: () => "/page-permission",
    detail: (id: string) => `/page-permission/${id}`,
    groups: (id: string) => `/page-permission/${id}/groups`
} as const;
