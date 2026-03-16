import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreditModule } from "../../credit/credit.module";
import { DynamicMarketController } from "./dynamic-market.controller";
import { DynamicMarketService } from "./dynamic-market.service";
import { MarketEventEntity } from "./entities/market-event.entity";
import { MarketEventLogEntity } from "./entities/market-event-log.entity";
import { MarketResourceEntity } from "./entities/market-resource.entity";
import { MarketTransactionEntity } from "./entities/market-transaction.entity";
import { UserInventoryEntity } from "./entities/user-inventory.entity";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MarketResourceEntity,
            MarketEventEntity,
            MarketEventLogEntity,
            MarketTransactionEntity,
            UserInventoryEntity
        ]),
        CreditModule
    ],
    controllers: [DynamicMarketController],
    providers: [DynamicMarketService],
    exports: [DynamicMarketService]
})
export class DynamicMarketModule {}
