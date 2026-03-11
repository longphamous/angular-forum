import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AnimeController } from "./anime.controller";
import { AnimeService } from "./anime.service";
import { AnimeEntity } from "./entities/anime.entity";

const ANIME_DB_CONNECTION = "anime-db";

/**
 * AnimeModule – connects to the local `__PLACEHOLDER__` PostgreSQL database
 * which contains the `public.anime` table.
 *
 * Uses a separate named TypeORM connection ("anime-db") so it does not
 * interfere with the main aniverse_base connection.
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
        TypeOrmModule.forFeature([AnimeEntity], ANIME_DB_CONNECTION)
    ],
    controllers: [AnimeController],
    providers: [AnimeService]
})
export class AnimeModule {}
