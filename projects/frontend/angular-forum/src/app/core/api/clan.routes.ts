export const CLAN_ROUTES = {
    list: () => "/clans",
    detail: (id: string) => `/clans/${id}`,
    my: () => "/clans/my",
    members: (id: string) => `/clans/${id}/members`,
    memberDetail: (clanId: string, memberId: string) => `/clans/${clanId}/members/${memberId}`,
    join: (id: string) => `/clans/${id}/join`,
    leave: (id: string) => `/clans/${id}/leave`,
    invite: (id: string) => `/clans/${id}/invite`,
    applications: (id: string) => `/clans/${id}/applications`,
    acceptApplication: (clanId: string, appId: string) => `/clans/${clanId}/applications/${appId}/accept`,
    declineApplication: (clanId: string, appId: string) => `/clans/${clanId}/applications/${appId}/decline`,
    pages: (id: string) => `/clans/${id}/pages`,
    pageDetail: (clanId: string, pageId: string) => `/clans/${clanId}/pages/${pageId}`,
    comments: (id: string) => `/clans/${id}/comments`,
    admin: {
        categories: () => "/clans/admin/categories",
        categoryDetail: (id: string) => `/clans/admin/categories/${id}`
    }
} as const;
