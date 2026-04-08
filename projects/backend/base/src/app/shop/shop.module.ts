import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreditModule } from "../credit/credit.module";
import { RpgModule } from "../rpg/rpg.module";
import { ShopItemEntity } from "./entities/shop-item.entity";
import { UserInventoryEntity } from "./entities/user-inventory.entity";
import { ShopController } from "./shop.controller";
import { ShopService } from "./shop.service";

@Module({
    imports: [TypeOrmModule.forFeature([ShopItemEntity, UserInventoryEntity]), CreditModule, RpgModule],
    controllers: [ShopController],
    providers: [ShopService],
    exports: [ShopService]
})
export class ShopModule {}
