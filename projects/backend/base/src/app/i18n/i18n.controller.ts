import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public, Roles } from "../auth/auth.decorators";
import { BulkUpsertTranslationDto } from "./dto/bulk-upsert-translation.dto";
import { UpdateI18nSettingsDto } from "./dto/update-i18n-settings.dto";
import { UpsertTranslationDto } from "./dto/upsert-translation.dto";
import { I18nSettingsEntity } from "./entities/i18n-settings.entity";
import { TranslationOverrideEntity } from "./entities/translation-override.entity";
import { I18nService, TranslationMap } from "./i18n.service";

@ApiTags("i18n")
@ApiBearerAuth("JWT")
@Controller("i18n")
export class I18nController {
    constructor(private readonly i18nService: I18nService) {}

    // ── Public endpoints (used by frontend loader) ─────────────────────────────

    /** GET /i18n/settings — returns i18n settings (public so frontend can adapt) */
    @Public()
    @Get("settings")
    getSettings(): Promise<I18nSettingsEntity> {
        return this.i18nService.getSettings();
    }

    /** GET /i18n/overrides/:locale — returns flat override map for a locale */
    @Public()
    @Get("overrides/:locale")
    getOverrideMap(@Param("locale") locale: string): Promise<TranslationMap> {
        return this.i18nService.getOverrideMap(locale);
    }

    // ── Admin endpoints ────────────────────────────────────────────────────────

    /** PATCH /i18n/settings — update i18n settings */
    @Roles("admin")
    @Patch("settings")
    updateSettings(@Body() dto: UpdateI18nSettingsDto): Promise<I18nSettingsEntity> {
        return this.i18nService.updateSettings(dto);
    }

    /** GET /i18n/overrides — list all overrides (optionally filter by locale) */
    @Roles("admin")
    @Get("overrides")
    getOverrides(@Query("locale") locale?: string): Promise<TranslationOverrideEntity[]> {
        return this.i18nService.getOverrides(locale);
    }

    /** POST /i18n/overrides — upsert a single translation override */
    @Roles("admin")
    @Post("overrides")
    upsert(@Body() dto: UpsertTranslationDto): Promise<TranslationOverrideEntity> {
        return this.i18nService.upsert(dto);
    }

    /** POST /i18n/overrides/bulk — upsert multiple translation overrides */
    @Roles("admin")
    @Post("overrides/bulk")
    bulkUpsert(@Body() dto: BulkUpsertTranslationDto): Promise<TranslationOverrideEntity[]> {
        return this.i18nService.bulkUpsert(dto.translations);
    }

    /** DELETE /i18n/overrides/:id — delete a specific override */
    @Roles("admin")
    @Delete("overrides/:id")
    async deleteOverride(@Param("id") id: string): Promise<{ success: boolean }> {
        await this.i18nService.deleteOverride(id);
        return { success: true };
    }
}
