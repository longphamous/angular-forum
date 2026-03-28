import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpsertTranslationDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(500)
    key!: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(10)
    locale!: string;

    @IsString()
    @IsNotEmpty()
    value!: string;
}
