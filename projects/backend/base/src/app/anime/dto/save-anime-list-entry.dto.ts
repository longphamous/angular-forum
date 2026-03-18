import { AnimeListStatus } from "../entities/user-anime-list.entity";

export class SaveAnimeListEntryDto {
    animeId!: number;
    status!: AnimeListStatus;
    score?: number;
    episodesWatched?: number;
    review?: string;
}
