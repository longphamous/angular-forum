import { Module } from "@nestjs/common";

import { AnimeModule } from "./anime.module";

/**
 * AnimeListModule re-exports AnimeModule so that other modules can import
 * AnimeListModule and transitively get AnimeService.
 *
 * The actual AnimeListController and AnimeListService live in AnimeModule
 * so that Express registers GET /anime/list BEFORE GET /anime/:id.
 */
@Module({
    imports: [AnimeModule],
    exports: [AnimeModule]
})
export class AnimeListModule {}
