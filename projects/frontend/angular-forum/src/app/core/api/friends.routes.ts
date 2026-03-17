export const FRIENDS_ROUTES = {
    list: () => "/friends",
    incomingRequests: () => "/friends/requests/incoming",
    outgoingRequests: () => "/friends/requests/outgoing",
    status: (userId: string) => `/friends/status/${userId}`,
    mutual: (userId: string) => `/friends/mutual/${userId}`,
    count: () => "/friends/count",
    sendRequest: (userId: string) => `/friends/request/${userId}`,
    accept: (id: string) => `/friends/${id}/accept`,
    decline: (id: string) => `/friends/${id}/decline`,
    remove: (id: string) => `/friends/${id}`
} as const;
