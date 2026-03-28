import { IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

import { UpsertTranslationDto } from "./upsert-translation.dto";

export class BulkUpsertTranslationDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpsertTranslationDto)
    translations!: UpsertTranslationDto[];
}
