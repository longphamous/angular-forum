import { UserSummary } from "../user/user-summary";
import { Post } from "./post";

export interface ThreadSummary {
  id: string;
  title: string;
  author: UserSummary;
  lastPostAt: string;
  replyCount: number;
}

export interface Thread extends ThreadSummary {
  content: string;
  posts: Post[];
}
