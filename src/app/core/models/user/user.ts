import { UserSummary } from "./user-summary";

export interface User extends UserSummary {
  roles: string[];
  reputation: number;
  joinedAt: string;
}
