export interface ConversationParticipant {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
}

export interface Conversation {
    id: string;
    participantIds: string[];
    participants: ConversationParticipant[];
    subject: string | null;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
    initiatedByUserId: string;
    createdAt: string;
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    content: string;
    isDraft: boolean;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationDetail {
    conversation: Conversation;
    messages: Message[];
}

export interface Draft {
    id: string;
    recipientId?: string;
    recipientName?: string;
    conversationId?: string;
    subject?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

export interface ComposePayload {
    recipientId: string;
    subject?: string;
    content: string;
}

export interface SendMessagePayload {
    content: string;
}

export interface SaveDraftPayload {
    recipientId?: string;
    subject?: string;
    content: string;
}
