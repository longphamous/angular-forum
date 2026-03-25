import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { MediaAssetEntity } from "./entities/media-asset.entity";
import { MediaConfigEntity } from "./entities/media-config.entity";
import { MediaVariantEntity } from "./entities/media-variant.entity";
import { StorageConfigEntity } from "./entities/storage-config.entity";
import { MediaController } from "./media.controller";
import { MediaService } from "./media.service";
import { MediaProcessingService } from "./media-processing.service";
import { MediaStorageService } from "./media-storage.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            MediaAssetEntity,
            MediaConfigEntity,
            MediaVariantEntity,
            StorageConfigEntity,
            UserEntity
        ])
    ],
    controllers: [MediaController],
    providers: [MediaService, MediaStorageService, MediaProcessingService],
    exports: [MediaService, MediaStorageService]
})
export class MediaModule {}
