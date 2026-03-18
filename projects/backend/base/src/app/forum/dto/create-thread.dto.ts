export class CreateThreadDto {
    title!: string;
    /** Content for the first post that is created together with the thread. */
    content!: string;
    isPinned?: boolean;
    isSticky?: boolean;
    tags?: string[];
    poll?: {
        question: string;
        options: { text: string; imageUrl?: string }[];
        isMultipleChoice?: boolean;
        isAnonymous?: boolean;
        showVoterNames?: boolean;
        allowVoteChange?: boolean;
        voteChangeDeadline?: string;
        closesAt?: string;
    };
}
