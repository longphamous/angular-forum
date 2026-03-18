import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreditModule } from "../../credit/credit.module";
import { MarketCategoryEntity } from "../../marketplace/entities/market-category.entity";
import { MarketListingEntity } from "../../marketplace/entities/market-listing.entity";
import { UserEntity } from "../../user/entities/user.entity";
import { BoosterPackEntity } from "./entities/booster-pack.entity";
import { BoosterPackCardEntity } from "./entities/booster-pack-card.entity";
import { CardEntity } from "./entities/card.entity";
import { UserBoosterEntity } from "./entities/user-booster.entity";
import { UserCardEntity } from "./entities/user-card.entity";
import { TcgController } from "./tcg.controller";
import { TcgService } from "./tcg.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CardEntity,
            BoosterPackEntity,
            BoosterPackCardEntity,
            UserCardEntity,
            UserBoosterEntity,
            UserEntity,
            MarketListingEntity,
            MarketCategoryEntity
        ]),
        CreditModule
    ],
    controllers: [TcgController],
    providers: [TcgService],
    exports: [TcgService]
})
export class TcgModule {}
