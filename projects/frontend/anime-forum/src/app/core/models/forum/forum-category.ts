import { Forum } from "./forum";

export interface ForumCategory {
  id: string;
  title: string;
  description?: string;
  order: number;
  subforums?: Forum[];
}
