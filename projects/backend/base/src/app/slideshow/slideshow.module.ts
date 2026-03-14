import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { TeaserSlideEntity } from "./entities/teaser-slide.entity";
import { SlideshowController } from "./slideshow.controller";
import { SlideshowService } from "./slideshow.service";

@Module({
    imports: [TypeOrmModule.forFeature([TeaserSlideEntity])],
    controllers: [SlideshowController],
    providers: [SlideshowService]
})
export class SlideshowModule {}
