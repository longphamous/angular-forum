import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

const ANIME_DB_CONNECTION = "anime-db";

export interface DashboardStatsDto {
    animeCount: number;
    postCount: number;
    threadCount: number;
    userCount: number;
}

export interface RecentThreadDto {
    authorName: string;
    forumName: string;
    id: string;
    lastPostAt: string;
    replyCount: number;
    title: string;
}

export interface NewestMemberDto {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    joinedAt: string;
}

export interface TopPosterDto {
    displayName: string;
    postCount: number;
    userId: string;
    username: string;
}

@Injectable()
export class DashboardService {
    constructor(
        @InjectDataSource() private readonly db: DataSource,
        @InjectDataSource(ANIME_DB_CONNECTION) private readonly animeDb: DataSource
    ) {}

    async getStats(): Promise<DashboardStatsDto> {
        const [forumStats, [animeRow]] = await Promise.all([
            this.db
                .query<{ user_count: string; thread_count: string; post_count: string }[]>(
                    `SELECT
                        (SELECT COUNT(*) FROM users)                                    AS user_count,
                        (SELECT COUNT(*) FROM forum_threads WHERE deleted_at IS NULL)   AS thread_count,
                        (SELECT COUNT(*) FROM forum_posts   WHERE deleted_at IS NULL)   AS post_count`
                )
                .then((rows) => rows[0]),
            this.animeDb.query<{ anime_count: string }[]>(
                "SELECT COUNT(*) AS anime_count FROM anime WHERE deleted_at IS NULL"
            )
        ]);

        return {
            animeCount: Number(animeRow.anime_count),
            postCount: Number(forumStats.post_count),
            threadCount: Number(forumStats.thread_count),
            userCount: Number(forumStats.user_count)
        };
    }

    async getRecentThreads(limit = 10): Promise<RecentThreadDto[]> {
        const rows = await this.db.query<
            {
                id: string;
                title: string;
                reply_count: string;
                last_post_at: string | null;
                forum_name: string;
                author_name: string;
            }[]
        >(
            `SELECT
                t.id,
                t.title,
                t.reply_count,
                t.last_post_at,
                f.name         AS forum_name,
                u.display_name AS author_name
             FROM forum_threads t
             INNER JOIN forums f ON f.id = t.forum_id
             INNER JOIN users  u ON u.id = t.author_id
             WHERE t.deleted_at IS NULL
             ORDER BY COALESCE(t.last_post_at, t.created_at) DESC
             LIMIT $1`,
            [limit]
        );

        return rows.map((r) => ({
            authorName: r.author_name,
            forumName: r.forum_name,
            id: r.id,
            lastPostAt: r.last_post_at ?? new Date(0).toISOString(),
            replyCount: Number(r.reply_count),
            title: r.title
        }));
    }

    async getTopPosters(limit = 10): Promise<TopPosterDto[]> {
        const rows = await this.db.query<
            {
                user_id: string;
                username: string;
                display_name: string;
                post_count: string;
            }[]
        >(
            `SELECT
                u.id           AS user_id,
                u.username,
                u.display_name,
                COUNT(p.id)    AS post_count
             FROM users u
             INNER JOIN forum_posts p ON p.author_id = u.id AND p.deleted_at IS NULL
             GROUP BY u.id, u.username, u.display_name
             ORDER BY post_count DESC
             LIMIT $1`,
            [limit]
        );

        return rows.map((r) => ({
            displayName: r.display_name,
            postCount: Number(r.post_count),
            userId: r.user_id,
            username: r.username
        }));
    }

    async getNewestMembers(limit = 5): Promise<NewestMemberDto[]> {
        const rows = await this.db.query<
            {
                user_id: string;
                username: string;
                display_name: string;
                avatar_url: string | null;
                created_at: string;
            }[]
        >(
            `SELECT id AS user_id, username, display_name, avatar_url, created_at
             FROM users ORDER BY created_at DESC LIMIT $1`,
            [limit]
        );

        return rows.map((r) => ({
            userId: r.user_id,
            username: r.username,
            displayName: r.display_name,
            avatarUrl: r.avatar_url ?? null,
            joinedAt: r.created_at
        }));
    }
}
