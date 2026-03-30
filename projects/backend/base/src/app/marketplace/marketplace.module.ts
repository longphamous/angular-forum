import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { AuctionController } from "./auction.controller";
import { AuctionService } from "./auction.service";
import { AuctionBidEntity } from "./entities/auction-bid.entity";
import { AuctionWatchEntity } from "./entities/auction-watch.entity";
import { AuctionEntity } from "./entities/auction.entity";
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
            AuctionEntity,
            AuctionBidEntity,
            AuctionWatchEntity,
            UserEntity
        ])
    ],
    controllers: [MarketplaceController, AuctionController],
    providers: [MarketplaceService, AuctionService],
    exports: [MarketplaceService, AuctionService]
})
export class MarketplaceModule {}
