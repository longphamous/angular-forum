export class CreateForumDto {
    name!: string;
    description?: string;
    position?: number;
    isLocked?: boolean;
    isPrivate?: boolean;
}
