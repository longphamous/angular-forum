import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateI18nSettingsDto {
    @IsBoolean()
    @IsOptional()
    multiLanguageEnabled?: boolean;

    @IsString()
    @IsOptional()
    @MaxLength(10)
    defaultLocale?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    availableLocales?: string[];
}
