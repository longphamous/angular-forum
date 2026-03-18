export const MESSAGES_ROUTES = {
    conversations: () => "/messages/conversations",
    conversation: (id: string) => `/messages/conversations/${id}`,
    sendMessage: (id: string) => `/messages/conversations/${id}/messages`,
    drafts: () => "/messages/drafts",
    draft: (id: string) => `/messages/drafts/${id}`
} as const;
