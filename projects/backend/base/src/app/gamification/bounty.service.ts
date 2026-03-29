import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { UserBountyEntity } from "./entities/user-bounty.entity";

/** Bounty multipliers — how much each unit of activity is worth */
const MULTIPLIERS = {
    coins: 100,           // 1 coin = 100 bounty
    xp: 50,               // 1 XP = 50 bounty
    posts: 500,            // 1 post = 500 bounty
    threads: 2000,         // 1 thread = 2000 bounty
    reactionsReceived: 300, // 1 reaction received = 300 bounty
    reactionsGiven: 100,   // 1 reaction given = 100 bounty
    achievements: 5000,    // 1 achievement = 5000 bounty
    lexiconArticles: 3000, // 1 lexicon article = 3000 bounty
    blogPosts: 4000,       // 1 blog post = 4000 bounty
    galleryUploads: 1500,  // 1 gallery upload = 1500 bounty
    clanMemberships: 2000, // 1 clan membership = 2000 bounty
    ticketsResolved: 1000  // 1 ticket resolved = 1000 bounty
};

/** Epithets based on bounty ranges (One Piece inspired) */
const EPITHETS: { min: number; epithet: string }[] = [
    { min: 50_000_000, epithet: "Emperor" },
    { min: 10_000_000, epithet: "Warlord" },
    { min: 5_000_000, epithet: "Supernova" },
    { min: 1_000_000, epithet: "Captain" },
    { min: 500_000, epithet: "Commander" },
    { min: 100_000, epithet: "Fighter" },
    { min: 50_000, epithet: "Rookie" },
    { min: 10_000, epithet: "Recruit" },
    { min: 0, epithet: "Unknown" }
];

export interface WantedPosterDto {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
    bounty: number;
    rank: number;
    epithet: string;
    breakdown: {
        coins: number;
        xp: number;
        posts: number;
        threads: number;
        reactions: number;
        achievements: number;
        lexicon: number;
        blog: number;
        gallery: number;
        clans: number;
        tickets: number;
    };
    calculatedAt: string;
}

@Injectable()
export class BountyService {
    private readonly logger = new Logger(BountyService.name);

    constructor(
        @InjectRepository(UserBountyEntity) private readonly bountyRepo: Repository<UserBountyEntity>,
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>,
        private readonly dataSource: DataSource
    ) {}

    /** Get the wanted poster for a single user */
    async getWantedPoster(userId: string): Promise<WantedPosterDto | null> {
        const bounty = await this.bountyRepo.findOne({ where: { userId } });
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) return null;

        if (!bounty) {
            // Calculate on-the-fly if not cached
            await this.recalculateUser(userId);
            return this.getWantedPoster(userId);
        }

        return this.toDto(bounty, user);
    }

    /** Get the bounty leaderboard */
    async getLeaderboard(limit = 50, offset = 0): Promise<{ data: WantedPosterDto[]; total: number }> {
        const [bounties, total] = await this.bountyRepo.findAndCount({
            order: { bounty: "DESC" },
            take: limit,
            skip: offset
        });

        if (!bounties.length) return { data: [], total: 0 };

        const userIds = bounties.map((b) => b.userId);
        const users = await this.userRepo.findByIds(userIds);
        const userMap = new Map(users.map((u) => [u.id, u]));

        const data = bounties
            .map((b, i) => {
                const user = userMap.get(b.userId);
                if (!user) return null;
                return { ...this.toDto(b, user), rank: offset + i + 1 };
            })
            .filter(Boolean) as WantedPosterDto[];

        return { data, total };
    }

    /** Recalculate bounty for a single user */
    async recalculateUser(userId: string): Promise<void> {
        const stats = await this.getUserStats(userId);

        const coinValue = stats.coins * MULTIPLIERS.coins;
        const xpValue = stats.xp * MULTIPLIERS.xp;
        const postValue = stats.posts * MULTIPLIERS.posts;
        const threadValue = stats.threads * MULTIPLIERS.threads;
        const reactionValue = (stats.reactionsReceived * MULTIPLIERS.reactionsReceived) + (stats.reactionsGiven * MULTIPLIERS.reactionsGiven);
        const achievementValue = stats.achievements * MULTIPLIERS.achievements;
        const lexiconValue = stats.lexiconArticles * MULTIPLIERS.lexiconArticles;
        const blogValue = stats.blogPosts * MULTIPLIERS.blogPosts;
        const galleryValue = stats.galleryUploads * MULTIPLIERS.galleryUploads;
        const clanValue = stats.clanMemberships * MULTIPLIERS.clanMemberships;
        const ticketValue = stats.ticketsResolved * MULTIPLIERS.ticketsResolved;

        const totalBounty = coinValue + xpValue + postValue + threadValue + reactionValue +
            achievementValue + lexiconValue + blogValue + galleryValue + clanValue + ticketValue;

        const epithet = this.getEpithet(totalBounty);

        await this.bountyRepo.save(
            this.bountyRepo.create({
                userId,
                bounty: totalBounty,
                coinValue,
                xpValue,
                postValue,
                threadValue,
                reactionValue,
                achievementValue,
                lexiconValue,
                blogValue,
                galleryValue,
                clanValue,
                ticketValue,
                epithet,
                calculatedAt: new Date()
            })
        );
    }

    /** Recalculate ALL user bounties and update ranks */
    async recalculateAll(): Promise<number> {
        const users = await this.userRepo.find({ where: { status: "active" }, select: ["id"] });
        this.logger.log(`Recalculating bounties for ${users.length} users...`);

        for (const user of users) {
            await this.recalculateUser(user.id);
        }

        // Update ranks
        await this.dataSource.query(`
            UPDATE user_bounties SET rank = sub.rn FROM (
                SELECT user_id, ROW_NUMBER() OVER (ORDER BY bounty DESC) AS rn
                FROM user_bounties
            ) sub WHERE user_bounties.user_id = sub.user_id
        `);

        this.logger.log(`Bounty recalculation complete for ${users.length} users`);
        return users.length;
    }

    /** Gather stats from ALL modules for a user */
    private async getUserStats(userId: string): Promise<{
        coins: number; xp: number; posts: number; threads: number;
        reactionsReceived: number; reactionsGiven: number; achievements: number;
        lexiconArticles: number; blogPosts: number; galleryUploads: number;
        clanMemberships: number; ticketsResolved: number;
    }> {
        const result = await this.dataSource.query(`
            SELECT
                COALESCE((SELECT balance FROM user_wallets WHERE user_id = $1), 0) AS coins,
                COALESCE((SELECT xp FROM user_xp WHERE user_id = $1), 0) AS xp,
                (SELECT COUNT(*) FROM forum_posts WHERE author_id = $1 AND deleted_at IS NULL)::int AS posts,
                (SELECT COUNT(*) FROM forum_threads WHERE author_id = $1 AND deleted_at IS NULL)::int AS threads,
                (SELECT COUNT(*) FROM forum_post_reactions r JOIN forum_posts p ON r.post_id = p.id WHERE p.author_id = $1)::int AS reactions_received,
                (SELECT COUNT(*) FROM forum_post_reactions WHERE user_id = $1)::int AS reactions_given,
                (SELECT COUNT(*) FROM user_achievements WHERE user_id = $1)::int AS achievements,
                COALESCE((SELECT COUNT(*) FROM lexicon_articles WHERE author_id = $1 AND deleted_at IS NULL), 0)::int AS lexicon_articles,
                COALESCE((SELECT COUNT(*) FROM blog_posts WHERE author_id = $1 AND deleted_at IS NULL), 0)::int AS blog_posts,
                COALESCE((SELECT COUNT(*) FROM gallery_media WHERE owner_id = $1), 0)::int AS gallery_uploads,
                COALESCE((SELECT COUNT(*) FROM clan_members WHERE user_id = $1), 0)::int AS clan_memberships,
                COALESCE((SELECT COUNT(*) FROM tickets WHERE assignee_id = $1 AND status IN ('resolved', 'closed') AND deleted_at IS NULL), 0)::int AS tickets_resolved
        `, [userId]);

        const row = result[0] ?? {};
        return {
            coins: parseInt(row.coins ?? "0", 10),
            xp: parseInt(row.xp ?? "0", 10),
            posts: parseInt(row.posts ?? "0", 10),
            threads: parseInt(row.threads ?? "0", 10),
            reactionsReceived: parseInt(row.reactions_received ?? "0", 10),
            reactionsGiven: parseInt(row.reactions_given ?? "0", 10),
            achievements: parseInt(row.achievements ?? "0", 10),
            lexiconArticles: parseInt(row.lexicon_articles ?? "0", 10),
            blogPosts: parseInt(row.blog_posts ?? "0", 10),
            galleryUploads: parseInt(row.gallery_uploads ?? "0", 10),
            clanMemberships: parseInt(row.clan_memberships ?? "0", 10),
            ticketsResolved: parseInt(row.tickets_resolved ?? "0", 10)
        };
    }

    private getEpithet(bounty: number): string {
        for (const e of EPITHETS) {
            if (bounty >= e.min) return e.epithet;
        }
        return "Unknown";
    }

    private toDto(b: UserBountyEntity, u: UserEntity): WantedPosterDto {
        return {
            userId: b.userId,
            username: u.username,
            displayName: u.displayName,
            avatarUrl: u.avatarUrl,
            bounty: Number(b.bounty),
            rank: b.rank ?? 0,
            epithet: b.epithet ?? this.getEpithet(Number(b.bounty)),
            breakdown: {
                coins: Number(b.coinValue),
                xp: Number(b.xpValue),
                posts: Number(b.postValue),
                threads: Number(b.threadValue),
                reactions: Number(b.reactionValue),
                achievements: Number(b.achievementValue),
                lexicon: Number(b.lexiconValue),
                blog: Number(b.blogValue),
                gallery: Number(b.galleryValue),
                clans: Number(b.clanValue),
                tickets: Number(b.ticketValue)
            },
            calculatedAt: b.calculatedAt.toISOString()
        };
    }
}
