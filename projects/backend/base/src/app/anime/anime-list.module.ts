import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AnimeListController } from "./anime-list.controller";
import { AnimeListService } from "./anime-list.service";
import { UserAnimeListEntity } from "./entities/user-anime-list.entity";
import { AnimeModule } from "./anime.module";

@Module({
    imports: [
        TypeOrmModule.forFeature([UserAnimeListEntity]),
        AnimeModule
    ],
    controllers: [AnimeListController],
    providers: [AnimeListService]
})
export class AnimeListModule {}
