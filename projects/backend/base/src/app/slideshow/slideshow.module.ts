import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { FeaturedItemEntity } from "./entities/featured-item.entity";
import { TeaserSlideEntity } from "./entities/teaser-slide.entity";
import { FeaturedController } from "./featured.controller";
import { FeaturedService } from "./featured.service";
import { SlideshowController } from "./slideshow.controller";
import { SlideshowService } from "./slideshow.service";

@Module({
    imports: [TypeOrmModule.forFeature([TeaserSlideEntity, FeaturedItemEntity])],
    controllers: [SlideshowController, FeaturedController],
    providers: [SlideshowService, FeaturedService]
})
export class SlideshowModule {}
