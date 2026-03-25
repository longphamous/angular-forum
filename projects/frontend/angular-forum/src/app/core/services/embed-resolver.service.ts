import { HttpClient } from "@angular/common/http";
import { inject, Injectable, Signal, signal } from "@angular/core";

import { EMBED_ROUTES } from "../api/embed.routes";
import { API_CONFIG, ApiConfig } from "../config/api.config";
import { LinkEmbed } from "../models/embed/link-embed";

@Injectable({ providedIn: "root" })
export class EmbedResolverService {
    private readonly http = inject(HttpClient);
    private readonly config = inject<ApiConfig>(API_CONFIG);
    private readonly cache = new Map<string, LinkEmbed>();

    resolve(url: string): Signal<LinkEmbed | null> {
        const cached = this.cache.get(url);
        if (cached) {
            return signal<LinkEmbed | null>(cached);
        }

        const result = signal<LinkEmbed | null>(null);
        const endpoint = `${this.config.baseUrl}${EMBED_ROUTES.resolve()}?url=${encodeURIComponent(url)}`;

        this.http.get<LinkEmbed>(endpoint).subscribe({
            next: (embed) => {
                this.cache.set(url, embed);
                result.set(embed);
            },
            error: () => {
                // Silently fail — no embed will be shown
            }
        });

        return result;
    }
}
