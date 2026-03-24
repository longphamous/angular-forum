import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";

import { Public, Roles } from "../auth/auth.decorators";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { MediaAccessLevel } from "./entities/media-asset.entity";
import { StorageBackendType, StorageConfigEntity } from "./entities/storage-config.entity";
import { MediaStorageService } from "./media-storage.service";
import { EnrichedMediaAsset, MediaService } from "./media.service";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB (supports video uploads)

@Controller("media")
export class MediaController {
    constructor(
        private readonly mediaService: MediaService,
        private readonly storageService: MediaStorageService
    ) {}

    @Roles("admin")
    @Get("admin/storage-config")
    getStorageConfig(@CurrentUser() _user: AuthenticatedUser): Promise<StorageConfigEntity> {
        return this.storageService.loadConfig();
    }

    @Roles("admin")
    @Patch("admin/storage-config")
    updateStorageConfig(
        @CurrentUser() _user: AuthenticatedUser,
        @Body() body: Partial<StorageConfigEntity>
    ): Promise<StorageConfigEntity> {
        const { id, updatedAt, ...patch } = body as Record<string, unknown>;
        return this.storageService.updateConfig(patch as Partial<StorageConfigEntity>);
    }

    @Roles("admin")
    @Post("admin/storage-config/test")
    testStorageConnection(
        @CurrentUser() _user: AuthenticatedUser,
        @Body() body: { backend: StorageBackendType }
    ): Promise<{ success: boolean; message: string }> {
        return this.storageService.testConnection(body.backend);
    }

    @Post("upload")
    @UseInterceptors(
        FileInterceptor("file", {
            storage: memoryStorage(),
            limits: { fileSize: MAX_FILE_SIZE }
        })
    )
    async upload(
        @UploadedFile() file: Express.Multer.File,
        @CurrentUser() user: AuthenticatedUser,
        @Body("sourceModule") sourceModule: string,
        @Body("category") category?: string,
        @Body("accessLevel") accessLevel?: MediaAccessLevel,
        @Body("altText") altText?: string,
        @Body("tags") tags?: string
    ): Promise<EnrichedMediaAsset> {
        if (!file) {
            throw new BadRequestException("No file provided");
        }
        if (!sourceModule) {
            throw new BadRequestException("sourceModule is required");
        }

        let parsedTags: string[] | undefined;
        if (tags) {
            try {
                parsedTags = JSON.parse(tags) as string[];
            } catch {
                parsedTags = tags.split(",").map((t) => t.trim());
            }
        }

        return this.mediaService.upload(file, user.userId, {
            sourceModule,
            category,
            accessLevel,
            altText,
            tags: parsedTags
        });
    }

    @Public()
    @Get("browse")
    async browse(
        @CurrentUser() user: AuthenticatedUser | undefined,
        @Query("sourceModule") sourceModule?: string,
        @Query("category") category?: string,
        @Query("ownerId") ownerId?: string,
        @Query("mimeType") mimeType?: string,
        @Query("search") search?: string,
        @Query("page") page?: string,
        @Query("limit") limit?: string
    ): Promise<{ data: EnrichedMediaAsset[]; total: number }> {
        const isAdmin = user?.role === "admin";
        return this.mediaService.browse(
            {
                sourceModule,
                category,
                ownerId,
                mimeType,
                search,
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 20
            },
            user?.userId,
            isAdmin
        );
    }

    @Public()
    @Get("user/:userId")
    async findByUser(
        @Param("userId", ParseUUIDPipe) userId: string,
        @Query("page") page?: string,
        @Query("limit") limit?: string
    ): Promise<{ data: EnrichedMediaAsset[]; total: number }> {
        return this.mediaService.findByUser(userId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20);
    }

    @Public()
    @Get(":id")
    async findById(@Param("id", ParseUUIDPipe) id: string): Promise<EnrichedMediaAsset> {
        return this.mediaService.findById(id);
    }

    @Patch(":id")
    async updateAsset(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { altText?: string; tags?: string[]; category?: string; accessLevel?: MediaAccessLevel }
    ): Promise<EnrichedMediaAsset> {
        const isAdmin = user.role === "admin";
        return this.mediaService.updateAsset(id, user.userId, isAdmin, body);
    }

    @Delete(":id")
    async deleteAsset(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser
    ): Promise<void> {
        const isAdmin = user.role === "admin";
        return this.mediaService.deleteAsset(id, user.userId, isAdmin);
    }

    @Post(":id/access")
    async changeAccess(
        @Param("id", ParseUUIDPipe) id: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body("accessLevel") accessLevel: MediaAccessLevel
    ): Promise<EnrichedMediaAsset> {
        if (!accessLevel) {
            throw new BadRequestException("accessLevel is required");
        }
        const isAdmin = user.role === "admin";
        return this.mediaService.changeAccess(id, user.userId, isAdmin, accessLevel);
    }
}
