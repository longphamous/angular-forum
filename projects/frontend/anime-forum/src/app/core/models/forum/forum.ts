import { ThreadSummary } from "./thread";

export interface Forum {
  id: string;
  title: string;
  description?: string;
  categoryId: string;
  threadCount: number;
  postCount: number;
  latestThread?: ThreadSummary;
}
