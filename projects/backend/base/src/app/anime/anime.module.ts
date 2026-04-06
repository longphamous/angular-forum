import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AnimeController } from "./anime.controller";
import { AnimeService } from "./anime.service";
import { AnimeV2Controller } from "./anime-v2.controller";
import { AnimeV2Service, ANIMEDB_V2_CONNECTION } from "./anime-v2.service";
import { AnimeListController } from "./anime-list.controller";
import { AnimeListService } from "./anime-list.service";
import { AnimeEntity } from "./entities/anime.entity";
import { AnimeV2Entity } from "./entities/anime-v2.entity";
import { UserAnimeListEntity } from "./entities/user-anime-list.entity";

const ANIME_DB_CONNECTION = "anime-db";

/**
 * AnimeModule – connects to two secondary PostgreSQL databases:
 *
 * 1. "anime-db"   – legacy connection (v1 endpoints, deprecated)
 * 2. "animedb-v2" – new animedb database (v2 endpoints)
 *
 * AnimeListController is registered first so that Express matches
 * GET /anime/list before the dynamic GET /anime/:id route.
 */
@Module({
    imports: [
        // ── v1 legacy connection ────────────────────────────────────────
        TypeOrmModule.forRootAsync({
            name: ANIME_DB_CONNECTION,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: "postgres" as const,
                host: config.get<string>("ANIME_DB_HOST", "localhost"),
                port: config.get<number>("ANIME_DB_PORT", 5432),
                username: config.getOrThrow<string>("ANIME_DB_USER"),
                password: config.get<string>("ANIME_DB_PASSWORD", ""),
                database: config.getOrThrow<string>("ANIME_DB_NAME"),
                schema: config.get<string>("ANIME_DB_SCHEMA", "public"),
                entities: [AnimeEntity],
                synchronize: false,
                logging: config.get<string>("NODE_ENV") === "development"
            })
        }),
        TypeOrmModule.forFeature([AnimeEntity], ANIME_DB_CONNECTION),

        // ── v2 animedb connection ───────────────────────────────────────
        TypeOrmModule.forRootAsync({
            name: ANIMEDB_V2_CONNECTION,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: "postgres" as const,
                host: config.get<string>("ANIMEDB_V2_HOST", "localhost"),
                port: config.get<number>("ANIMEDB_V2_PORT", 5432),
                username: config.getOrThrow<string>("ANIMEDB_V2_USER"),
                password: config.get<string>("ANIMEDB_V2_PASSWORD", ""),
                database: config.getOrThrow<string>("ANIMEDB_V2_NAME"),
                schema: config.get<string>("ANIMEDB_V2_SCHEMA", "public"),
                entities: [AnimeV2Entity],
                synchronize: false,
                logging: config.get<string>("NODE_ENV") === "development"
            })
        }),
        TypeOrmModule.forFeature([AnimeV2Entity], ANIMEDB_V2_CONNECTION),

        // UserAnimeListEntity uses the default (aniverse_base) connection
        TypeOrmModule.forFeature([UserAnimeListEntity])
    ],
    // AnimeListController MUST come before AnimeController so that
    // GET /anime/list is registered before GET /anime/:id in Express.
    // AnimeV2Controller uses /v2/anime prefix so order doesn't matter.
    controllers: [AnimeListController, AnimeController, AnimeV2Controller],
    providers: [AnimeListService, AnimeService, AnimeV2Service],
    exports: [AnimeService, AnimeV2Service]
})
export class AnimeModule {}
