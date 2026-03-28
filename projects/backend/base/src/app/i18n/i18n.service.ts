import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UpdateI18nSettingsDto } from "./dto/update-i18n-settings.dto";
import { UpsertTranslationDto } from "./dto/upsert-translation.dto";
import { I18nSettingsEntity } from "./entities/i18n-settings.entity";
import { TranslationOverrideEntity } from "./entities/translation-override.entity";

export interface TranslationMap {
    [key: string]: string;
}

@Injectable()
export class I18nService {
    constructor(
        @InjectRepository(TranslationOverrideEntity)
        private readonly overrideRepo: Repository<TranslationOverrideEntity>,
        @InjectRepository(I18nSettingsEntity)
        private readonly settingsRepo: Repository<I18nSettingsEntity>
    ) {}

    // ── Settings ───────────────────────────────────────────────────────────────

    async getSettings(): Promise<I18nSettingsEntity> {
        let settings = await this.settingsRepo.findOne({ where: { id: "global" } });
        if (!settings) {
            settings = this.settingsRepo.create({
                id: "global",
                multiLanguageEnabled: false,
                defaultLocale: "en",
                availableLocales: ["en", "de"]
            });
            await this.settingsRepo.save(settings);
        }
        return settings;
    }

    async updateSettings(dto: UpdateI18nSettingsDto): Promise<I18nSettingsEntity> {
        const settings = await this.getSettings();
        if (dto.multiLanguageEnabled !== undefined) settings.multiLanguageEnabled = dto.multiLanguageEnabled;
        if (dto.defaultLocale !== undefined) settings.defaultLocale = dto.defaultLocale;
        if (dto.availableLocales !== undefined) settings.availableLocales = dto.availableLocales;
        return this.settingsRepo.save(settings);
    }

    // ── Translation Overrides ──────────────────────────────────────────────────

    /** Get all overrides, optionally filtered by locale */
    async getOverrides(locale?: string): Promise<TranslationOverrideEntity[]> {
        if (locale) {
            return this.overrideRepo.find({ where: { locale }, order: { key: "ASC" } });
        }
        return this.overrideRepo.find({ order: { key: "ASC", locale: "ASC" } });
    }

    /** Get overrides as a flat key-value map for a specific locale (used by frontend loader) */
    async getOverrideMap(locale: string): Promise<TranslationMap> {
        const overrides = await this.overrideRepo.find({ where: { locale } });
        const map: TranslationMap = {};
        for (const o of overrides) {
            map[o.key] = o.value;
        }
        return map;
    }

    /** Upsert a single translation override */
    async upsert(dto: UpsertTranslationDto): Promise<TranslationOverrideEntity> {
        let entity = await this.overrideRepo.findOne({ where: { key: dto.key, locale: dto.locale } });
        if (entity) {
            entity.value = dto.value;
        } else {
            entity = this.overrideRepo.create(dto);
        }
        return this.overrideRepo.save(entity);
    }

    /** Upsert multiple translation overrides in a single transaction */
    async bulkUpsert(translations: UpsertTranslationDto[]): Promise<TranslationOverrideEntity[]> {
        const results: TranslationOverrideEntity[] = [];
        for (const dto of translations) {
            results.push(await this.upsert(dto));
        }
        return results;
    }

    /** Delete a single translation override */
    async deleteOverride(id: string): Promise<void> {
        const entity = await this.overrideRepo.findOne({ where: { id } });
        if (!entity) throw new NotFoundException(`Translation override with id "${id}" not found`);
        await this.overrideRepo.remove(entity);
    }

    /** Delete all overrides for a specific key (all locales) */
    async deleteByKey(key: string): Promise<void> {
        await this.overrideRepo.delete({ key });
    }
}
