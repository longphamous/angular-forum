import { MangaListStatus } from "../entities/user-manga-list.entity";

export class SaveMangaListEntryDto {
    mangaId!: number;
    status!: MangaListStatus;
    score?: number;
    chaptersRead?: number;
    volumesRead?: number;
    review?: string;
}
