import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, ILike, Repository } from "typeorm";

import { HashtagEntity } from "./entities/hashtag.entity";
import { HashtagContentType, HashtagUsageEntity } from "./entities/hashtag-usage.entity";

// ── Regex to match #hashtags ──────────────────────────────────────────────────
// Matches # followed by word characters (letters, digits, underscore), min 2 chars.
// Ignores hashtags inside HTML tags or attributes.
const HASHTAG_REGEX = /(?:^|[\s>])#([a-zA-Z\u00C0-\u024F\u1E00-\u1EFF][\w\u00C0-\u024F\u1E00-\u1EFF]{1,49})/g;

export interface HashtagDto {
    id: string;
    name: string;
    usageCount: number;
}

export interface HashtagSearchResult {
    contentType: HashtagContentType;
    contentId: string;
    authorId: string;
    createdAt: string;
}

export interface HashtagSearchResponse {
    hashtag: HashtagDto;
    results: HashtagSearchResult[];
    total: number;
}

@Injectable()
export class HashtagService {
    private readonly logger = new Logger(HashtagService.name);

    constructor(
        @InjectRepository(HashtagEntity)
        private readonly hashtagRepo: Repository<HashtagEntity>,
        @InjectRepository(HashtagUsageEntity)
        private readonly usageRepo: Repository<HashtagUsageEntity>,
        @InjectDataSource()
        private readonly dataSource: DataSource
    ) {}

    // ── Extract hashtags from text/HTML ───────────────────────────────────────

    extractHashtags(content: string): string[] {
        // Strip HTML tags to avoid matching inside attributes
        const textOnly = content.replace(/<[^>]*>/g, " ");
        const tags = new Set<string>();
        let match: RegExpExecArray | null;
        const regex = new RegExp(HASHTAG_REGEX.source, HASHTAG_REGEX.flags);
        while ((match = regex.exec(textOnly)) !== null) {
            tags.add(match[1].toLowerCase());
        }
        return [...tags];
    }

    // ── Sync hashtags for a piece of content ─────────────────────────────────

    async syncHashtags(
        contentType: HashtagContentType,
        contentId: string,
        authorId: string,
        htmlContent: string
    ): Promise<string[]> {
        const extracted = this.extractHashtags(htmlContent);

        // Remove old usages for this content
        await this.usageRepo.delete({ contentType, contentId });

        if (extracted.length === 0) return [];

        // Upsert hashtag entities
        for (const name of extracted) {
            await this.dataSource.query(
                `INSERT INTO hashtags (id, name, usage_count, created_at, updated_at)
                 VALUES (gen_random_uuid(), $1, 0, NOW(), NOW())
                 ON CONFLICT (name) DO NOTHING`,
                [name]
            );
        }

        // Fetch hashtag records
        const hashtags = await this.hashtagRepo.find({
            where: extracted.map((name) => ({ name }))
        });

        // Create usage records
        const usages = hashtags.map((h) =>
            this.usageRepo.create({ hashtagId: h.id, contentType, contentId, authorId })
        );
        await this.usageRepo.save(usages);

        // Recalculate usage counts for affected hashtags
        for (const h of hashtags) {
            const count = await this.usageRepo.count({ where: { hashtagId: h.id } });
            await this.hashtagRepo.update(h.id, { usageCount: count });
        }

        return extracted;
    }

    // ── Remove usages when content is deleted ────────────────────────────────

    async removeUsages(contentType: HashtagContentType, contentId: string): Promise<void> {
        const usages = await this.usageRepo.find({ where: { contentType, contentId } });
        if (usages.length === 0) return;

        const hashtagIds = [...new Set(usages.map((u) => u.hashtagId))];
        await this.usageRepo.delete({ contentType, contentId });

        // Recalculate counts
        for (const hid of hashtagIds) {
            const count = await this.usageRepo.count({ where: { hashtagId: hid } });
            await this.hashtagRepo.update(hid, { usageCount: count });
        }
    }

    // ── Autocomplete ─────────────────────────────────────────────────────────

    async autocomplete(query: string, limit = 10): Promise<HashtagDto[]> {
        if (!query || query.length < 2) return [];
        const rows = await this.hashtagRepo.find({
            where: { name: ILike(`${query.toLowerCase()}%`) },
            order: { usageCount: "DESC" },
            take: Math.min(limit, 20)
        });
        return rows.map((r) => ({ id: r.id, name: r.name, usageCount: r.usageCount }));
    }

    // ── Trending ─────────────────────────────────────────────────────────────

    async getTrending(limit = 20): Promise<HashtagDto[]> {
        const rows = await this.hashtagRepo.find({
            where: {},
            order: { usageCount: "DESC" },
            take: Math.min(limit, 50)
        });
        return rows.filter((r) => r.usageCount > 0).map((r) => ({
            id: r.id,
            name: r.name,
            usageCount: r.usageCount
        }));
    }

    // ── Search by hashtag ────────────────────────────────────────────────────

    async searchByHashtag(
        tag: string,
        limit = 50,
        offset = 0
    ): Promise<HashtagSearchResponse | null> {
        const hashtag = await this.hashtagRepo.findOneBy({ name: tag.toLowerCase() });
        if (!hashtag) return null;

        const [usages, total] = await this.usageRepo.findAndCount({
            where: { hashtagId: hashtag.id },
            order: { createdAt: "DESC" },
            take: Math.min(limit, 100),
            skip: offset
        });

        return {
            hashtag: { id: hashtag.id, name: hashtag.name, usageCount: hashtag.usageCount },
            results: usages.map((u) => ({
                contentType: u.contentType,
                contentId: u.contentId,
                authorId: u.authorId,
                createdAt: u.createdAt.toISOString()
            })),
            total
        };
    }

    // ── Get hashtag by name ──────────────────────────────────────────────────

    async getByName(name: string): Promise<HashtagDto | null> {
        const h = await this.hashtagRepo.findOneBy({ name: name.toLowerCase() });
        return h ? { id: h.id, name: h.name, usageCount: h.usageCount } : null;
    }
}
