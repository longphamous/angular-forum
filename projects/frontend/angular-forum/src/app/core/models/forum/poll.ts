export interface Poll {
    id: string;
    threadId: string;
    question: string;
    options: PollOption[];
    totalVotes: number;
    isMultipleChoice: boolean;
    isClosed: boolean;
    closesAt: string | null;
    myVote: number | null;
    createdAt: string;
}

export interface PollOption {
    index: number;
    text: string;
    votes: number;
    percentage: number;
}
