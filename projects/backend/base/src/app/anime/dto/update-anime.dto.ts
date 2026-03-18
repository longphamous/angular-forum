import { CreateAnimeDto } from "./create-anime.dto";

// All fields of CreateAnimeDto are optional for partial updates
export type UpdateAnimeDto = Partial<CreateAnimeDto>;
