export class UpdateThreadDto {
    title?: string;
    isPinned?: boolean;
    isLocked?: boolean;
    isSticky?: boolean;
    tags?: string[];
    forumId?: string;
}
