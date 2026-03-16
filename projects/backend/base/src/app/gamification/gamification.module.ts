import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AchievementController } from "./achievement.controller";
import { AchievementService } from "./achievement.service";
import { DynamicMarketModule } from "./dynamic-market/dynamic-market.module";
import { AchievementEntity } from "./entities/achievement.entity";
import { UserAchievementEntity } from "./entities/user-achievement.entity";
import { UserXpEntity } from "./entities/user-xp.entity";
import { XpConfigEntity } from "./entities/xp-config.entity";
import { XpEventEntity } from "./entities/xp-event.entity";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            AchievementEntity,
            UserAchievementEntity,
            UserXpEntity,
            XpEventEntity,
            XpConfigEntity
        ]),
        DynamicMarketModule
    ],
    controllers: [GamificationController, AchievementController],
    providers: [GamificationService, AchievementService],
    exports: [GamificationService, AchievementService, DynamicMarketModule]
})
export class GamificationModule {}
