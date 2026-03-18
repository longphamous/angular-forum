export interface Poll {
    id: string;
    threadId: string;
    authorId: string;
    question: string;
    options: PollOption[];
    totalVotes: number;
    isMultipleChoice: boolean;
    isAnonymous: boolean;
    showVoterNames: boolean;
    isClosed: boolean;
    closesAt: string | null;
    allowVoteChange: boolean;
    canChangeVote: boolean;
    voteChangeDeadline: string | null;
    myVote: number | null;
    createdAt: string;
}

export interface PollOption {
    index: number;
    text: string;
    imageUrl?: string;
    votes: number;
    percentage: number;
    voters?: PollVoter[];
}

export interface PollVoter {
    userId: string;
    username: string;
    avatarUrl?: string;
}
