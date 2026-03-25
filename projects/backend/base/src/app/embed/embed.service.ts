import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LinkEmbedEntity } from "./entities/link-embed.entity";

export interface LinkEmbedDto {
    url: string;
    title: string | null;
    description: string | null;
    imageUrl: string | null;
    siteName: string | null;
    faviconUrl: string | null;
    domain: string;
}

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const FETCH_TIMEOUT_MS = 5000;

@Injectable()
export class EmbedService {
    private readonly logger = new Logger(EmbedService.name);

    constructor(
        @InjectRepository(LinkEmbedEntity)
        private readonly embedRepo: Repository<LinkEmbedEntity>
    ) {}

    async resolve(url: string): Promise<LinkEmbedDto> {
        // Validate URL
        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch {
            return this.fallbackDto(url);
        }
        if (!["http:", "https:"].includes(parsed.protocol)) {
            return this.fallbackDto(url);
        }

        // Check cache
        const cached = await this.embedRepo.findOneBy({ url });
        if (cached && Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS) {
            return this.toDto(cached);
        }

        // Fetch OG data
        try {
            const ogData = await this.fetchOgData(url);
            const entity = cached ?? this.embedRepo.create({ url });
            entity.title = ogData.title;
            entity.description = ogData.description;
            entity.imageUrl = ogData.imageUrl;
            entity.siteName = ogData.siteName;
            entity.faviconUrl = ogData.faviconUrl;
            entity.fetchedAt = new Date();
            await this.embedRepo.save(entity);
            return this.toDto(entity);
        } catch (err) {
            this.logger.warn(`Failed to fetch OG data for ${url}: ${(err as Error).message}`);
            return this.fallbackDto(url);
        }
    }

    async resolveMany(urls: string[]): Promise<LinkEmbedDto[]> {
        const unique = [...new Set(urls)].slice(0, 10); // max 10
        return Promise.all(unique.map((u) => this.resolve(u)));
    }

    private async fetchOgData(url: string): Promise<{
        title: string | null;
        description: string | null;
        imageUrl: string | null;
        siteName: string | null;
        faviconUrl: string | null;
    }> {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
            headers: {
                "User-Agent": "Aniverse/1.0 (Rich Embed Bot)",
                Accept: "text/html,application/xhtml+xml"
            },
            redirect: "follow"
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get("content-type") ?? "";
        if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
            throw new Error(`Not HTML: ${contentType}`);
        }

        // Only read first 50KB to avoid downloading huge pages
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        let html = "";
        const decoder = new TextDecoder();
        const maxBytes = 50 * 1024;
        let bytesRead = 0;

        while (bytesRead < maxBytes) {
            const { done, value } = await reader.read();
            if (done) break;
            html += decoder.decode(value, { stream: true });
            bytesRead += value.length;
        }
        reader.cancel().catch(() => undefined);

        return this.parseOgTags(html, url);
    }

    private parseOgTags(
        html: string,
        url: string
    ): {
        title: string | null;
        description: string | null;
        imageUrl: string | null;
        siteName: string | null;
        faviconUrl: string | null;
    } {
        const getMetaContent = (property: string): string | null => {
            // Match both property="og:X" content="Y" and content="Y" property="og:X" orders
            const pattern1 = new RegExp(
                `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']*)["']`,
                "i"
            );
            const pattern2 = new RegExp(
                `<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${property}["']`,
                "i"
            );
            return pattern1.exec(html)?.[1] ?? pattern2.exec(html)?.[1] ?? null;
        };

        const getMetaName = (name: string): string | null => {
            const pattern1 = new RegExp(
                `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`,
                "i"
            );
            const pattern2 = new RegExp(
                `<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`,
                "i"
            );
            return pattern1.exec(html)?.[1] ?? pattern2.exec(html)?.[1] ?? null;
        };

        let title = getMetaContent("og:title");
        if (!title) {
            // Fallback to <title> tag
            const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
            title = titleMatch?.[1]?.trim() ?? null;
        }

        let description = getMetaContent("og:description");
        if (!description) {
            description = getMetaName("description");
        }
        if (description && description.length > 300) {
            description = description.slice(0, 297) + "...";
        }

        let imageUrl = getMetaContent("og:image");
        if (imageUrl && !imageUrl.startsWith("http")) {
            try {
                imageUrl = new URL(imageUrl, url).href;
            } catch {
                imageUrl = null;
            }
        }

        const siteName = getMetaContent("og:site_name");

        // Favicon
        let faviconUrl: string | null = null;
        const iconMatch =
            html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']*)["']/i) ??
            html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["'](?:icon|shortcut icon)["']/i);
        if (iconMatch?.[1]) {
            try {
                faviconUrl = new URL(iconMatch[1], url).href;
            } catch {
                faviconUrl = null;
            }
        }
        if (!faviconUrl) {
            try {
                faviconUrl = new URL("/favicon.ico", url).href;
            } catch {
                // ignore
            }
        }

        return { title, description, imageUrl, siteName, faviconUrl };
    }

    private toDto(entity: LinkEmbedEntity): LinkEmbedDto {
        let domain = "";
        try {
            domain = new URL(entity.url).hostname.replace(/^www\./, "");
        } catch {
            // ignore
        }
        return {
            url: entity.url,
            title: entity.title,
            description: entity.description,
            imageUrl: entity.imageUrl,
            siteName: entity.siteName,
            faviconUrl: entity.faviconUrl,
            domain
        };
    }

    private fallbackDto(url: string): LinkEmbedDto {
        let domain = "";
        try {
            domain = new URL(url).hostname.replace(/^www\./, "");
        } catch {
            // ignore
        }
        return {
            url,
            title: null,
            description: null,
            imageUrl: null,
            siteName: null,
            faviconUrl: null,
            domain
        };
    }
}
