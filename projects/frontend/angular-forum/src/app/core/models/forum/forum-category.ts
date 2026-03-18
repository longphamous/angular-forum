import { Forum } from "./forum";

export interface ForumCategory {
    id: string;
    name: string;
    slug: string;
    description?: string;
    position: number;
    isActive: boolean;
    forums?: Forum[];
    createdAt: string;
    updatedAt: string;
}
