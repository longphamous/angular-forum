import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AnimeController } from "./anime.controller";
import { AnimeService } from "./anime.service";
import { AnimeListController } from "./anime-list.controller";
import { AnimeListService } from "./anime-list.service";
import { AnimeEntity } from "./entities/anime.entity";
import { UserAnimeListEntity } from "./entities/user-anime-list.entity";

const ANIME_DB_CONNECTION = "anime-db";

/**
 * AnimeModule – connects to the local `__PLACEHOLDER__` PostgreSQL database
 * which contains the `public.anime` table.
 *
 * Uses a separate named TypeORM connection ("anime-db") so it does not
 * interfere with the main aniverse_base connection.
 *
 * AnimeListController is registered HERE (before AnimeController) so that
 * Express matches GET /anime/list before the dynamic GET /anime/:id route.
 */
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            name: ANIME_DB_CONNECTION,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: "postgres" as const,
                host: config.get<string>("ANIME_DB_HOST", "localhost"),
                port: config.get<number>("ANIME_DB_PORT", 5432),
                username: config.get<string>("ANIME_DB_USER", "__PLACEHOLDER__"),
                password: config.get<string>("ANIME_DB_PASSWORD", ""),
                database: config.get<string>("ANIME_DB_NAME", "__PLACEHOLDER__"),
                schema: config.get<string>("ANIME_DB_SCHEMA", "public"),
                entities: [AnimeEntity],
                synchronize: false,
                logging: config.get<string>("NODE_ENV") === "development"
            })
        }),
        TypeOrmModule.forFeature([AnimeEntity], ANIME_DB_CONNECTION),
        // UserAnimeListEntity uses the default (aniverse_base) connection
        TypeOrmModule.forFeature([UserAnimeListEntity])
    ],
    // AnimeListController MUST come before AnimeController so that
    // GET /anime/list is registered before GET /anime/:id in Express
    controllers: [AnimeListController, AnimeController],
    providers: [AnimeListService, AnimeService],
    exports: [AnimeService]
})
export class AnimeModule {}
