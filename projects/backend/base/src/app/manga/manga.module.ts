import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ANIMEDB_V2_CONNECTION } from "../anime/anime-v2.service";
import { MangaEntity } from "./entities/manga.entity";
import { UserMangaListEntity } from "./entities/user-manga-list.entity";
import { MangaController } from "./manga.controller";
import { MangaListController } from "./manga-list.controller";
import { MangaListService } from "./manga-list.service";
import { MangaService } from "./manga.service";

@Module({
    imports: [
        // Reuse the existing animedb-v2 connection — register MangaEntity with it
        TypeOrmModule.forFeature([MangaEntity], ANIMEDB_V2_CONNECTION),
        // UserMangaListEntity uses the default (aniverse_base) connection
        TypeOrmModule.forFeature([UserMangaListEntity])
    ],
    // MangaListController MUST come before MangaController so that
    // GET /manga/list is registered before any dynamic routes.
    controllers: [MangaListController, MangaController],
    providers: [MangaListService, MangaService],
    exports: [MangaService]
})
export class MangaModule {}
