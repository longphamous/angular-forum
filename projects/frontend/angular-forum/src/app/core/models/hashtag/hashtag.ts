export interface Hashtag {
    id: string;
    name: string;
    usageCount: number;
}

export type HashtagContentType = "post" | "thread" | "blog" | "chronik" | "lexicon";

export interface HashtagSearchResult {
    contentType: HashtagContentType;
    contentId: string;
    authorId: string;
    createdAt: string;
}

export interface HashtagSearchResponse {
    hashtag: Hashtag;
    results: HashtagSearchResult[];
    total: number;
}
