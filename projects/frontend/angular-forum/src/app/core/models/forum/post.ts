import { UserSummary } from "../user/user-summary";

export interface Post {
    id: string;
    threadId: string;
    author: UserSummary;
    content: string;
    createdAt: string;
    editedAt?: string;
    isEdited: boolean;
    replyToPostId?: string;
}
