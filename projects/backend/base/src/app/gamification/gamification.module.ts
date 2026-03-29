import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { AchievementController } from "./achievement.controller";
import { AchievementService } from "./achievement.service";
import { BountyController } from "./bounty.controller";
import { BountyService } from "./bounty.service";
import { DynamicMarketModule } from "./dynamic-market/dynamic-market.module";
import { AchievementEntity } from "./entities/achievement.entity";
import { AchievementCategoryEntity } from "./entities/achievement-category.entity";
import { UserAchievementEntity } from "./entities/user-achievement.entity";
import { UserBountyEntity } from "./entities/user-bounty.entity";
import { UserXpEntity } from "./entities/user-xp.entity";
import { XpConfigEntity } from "./entities/xp-config.entity";
import { XpEventEntity } from "./entities/xp-event.entity";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            AchievementCategoryEntity,
            AchievementEntity,
            UserAchievementEntity,
            UserXpEntity,
            XpEventEntity,
            XpConfigEntity,
            UserBountyEntity,
            UserEntity
        ]),
        DynamicMarketModule
    ],
    controllers: [GamificationController, AchievementController, BountyController],
    providers: [GamificationService, AchievementService, BountyService],
    exports: [GamificationService, AchievementService, BountyService, DynamicMarketModule]
})
export class GamificationModule {}
