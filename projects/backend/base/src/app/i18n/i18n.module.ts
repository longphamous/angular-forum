import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { I18nSettingsEntity } from "./entities/i18n-settings.entity";
import { TranslationOverrideEntity } from "./entities/translation-override.entity";
import { I18nController } from "./i18n.controller";
import { I18nService } from "./i18n.service";

@Module({
    imports: [TypeOrmModule.forFeature([TranslationOverrideEntity, I18nSettingsEntity])],
    controllers: [I18nController],
    providers: [I18nService],
    exports: [I18nService]
})
export class I18nModule {}
