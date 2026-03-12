export class CreateThreadDto {
    title!: string;
    /** Content for the first post that is created together with the thread. */
    content!: string;
    isPinned?: boolean;
    isSticky?: boolean;
}
