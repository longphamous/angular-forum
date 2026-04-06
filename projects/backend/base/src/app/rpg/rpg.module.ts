import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreditModule } from "../credit/credit.module";
import { GamificationModule } from "../gamification/gamification.module";
import { ShopItemEntity } from "../shop/entities/shop-item.entity";
import { UserInventoryEntity } from "../shop/entities/user-inventory.entity";
import { QuestEntity } from "./entities/quest.entity";
import { UserCharacterEntity } from "./entities/user-character.entity";
import { UserQuestEntity } from "./entities/user-quest.entity";
import { QuestController } from "./quest.controller";
import { QuestService } from "./quest.service";
import { RpgController } from "./rpg.controller";
import { RpgService } from "./rpg.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            UserCharacterEntity,
            UserInventoryEntity,
            ShopItemEntity,
            QuestEntity,
            UserQuestEntity
        ]),
        GamificationModule,
        CreditModule
    ],
    controllers: [RpgController, QuestController],
    providers: [RpgService, QuestService],
    exports: [RpgService, QuestService]
})
export class RpgModule {}
