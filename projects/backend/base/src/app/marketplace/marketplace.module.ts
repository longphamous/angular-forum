import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { MarketCategoryEntity } from "./entities/market-category.entity";
import { MarketCommentEntity } from "./entities/market-comment.entity";
import { MarketListingEntity } from "./entities/market-listing.entity";
import { MarketOfferEntity } from "./entities/market-offer.entity";
import { MarketRatingEntity } from "./entities/market-rating.entity";
import { MarketReportEntity } from "./entities/market-report.entity";
import { MarketplaceController } from "./marketplace.controller";
import { MarketplaceService } from "./marketplace.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MarketCategoryEntity,
            MarketListingEntity,
            MarketOfferEntity,
            MarketCommentEntity,
            MarketRatingEntity,
            MarketReportEntity,
            UserEntity
        ])
    ],
    controllers: [MarketplaceController],
    providers: [MarketplaceService],
    exports: [MarketplaceService]
})
export class MarketplaceModule {}
