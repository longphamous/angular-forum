import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { XpConfigEntity } from "./entities/xp-config.entity";
import { UserXpEntity } from "./entities/user-xp.entity";
import { XpEventEntity } from "./entities/xp-event.entity";
import { GamificationController } from "./gamification.controller";
import { GamificationService } from "./gamification.service";

@Module({
    imports: [TypeOrmModule.forFeature([UserXpEntity, XpEventEntity, XpConfigEntity])],
    controllers: [GamificationController],
    providers: [GamificationService],
    exports: [GamificationService]
})
export class GamificationModule {}
