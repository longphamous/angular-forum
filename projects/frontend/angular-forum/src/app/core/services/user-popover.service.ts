import { HttpClient } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";

import { UserCardData } from "../../shared/components/user-popover/user-popover-card";
import { USER_ROUTES } from "../api/user.routes";
import { API_CONFIG, ApiConfig } from "../config/api.config";
import { UserProfile } from "../models/user/user";

@Injectable({ providedIn: "root" })
export class UserPopoverService {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly cache = new Map<string, UserCardData>();
    private readonly pending = new Map<string, Signal<UserCardData | null>>();

    resolve(userId: string): Signal<UserCardData | null> {
        const cached = this.cache.get(userId);
        if (cached) return signal(cached);

        const existing = this.pending.get(userId);
        if (existing) return existing;

        const result = signal<UserCardData | null>(null);
        this.pending.set(userId, result);

        this.http.get<UserProfile>(`${this.config.baseUrl}${USER_ROUTES.publicProfile(userId)}`).subscribe({
            next: (profile) => {
                const card: UserCardData = {
                    id: profile.id,
                    username: profile.username,
                    displayName: profile.displayName,
                    avatarUrl: profile.avatarUrl,
                    coverUrl: profile.coverUrl,
                    role: profile.role,
                    bio: profile.bio,
                    postCount: profile.postCount,
                    level: profile.level,
                    levelName: profile.levelName,
                    xp: profile.xp,
                    createdAt: profile.createdAt
                };
                this.cache.set(userId, card);
                result.set(card);
            },
            error: () => {
                this.pending.delete(userId);
            }
        });

        return result;
    }
}
