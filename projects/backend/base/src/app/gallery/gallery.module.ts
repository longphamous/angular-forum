import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { GalleryAlbumEntity } from "./entities/gallery-album.entity";
import { GalleryCommentEntity } from "./entities/gallery-comment.entity";
import { GalleryMediaEntity } from "./entities/gallery-media.entity";
import { GalleryRatingEntity } from "./entities/gallery-rating.entity";
import { GalleryController } from "./gallery.controller";
import { GalleryService } from "./gallery.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            GalleryAlbumEntity,
            GalleryMediaEntity,
            GalleryCommentEntity,
            GalleryRatingEntity,
            UserEntity
        ])
    ],
    controllers: [GalleryController],
    providers: [GalleryService],
    exports: [GalleryService]
})
export class GalleryModule {}
