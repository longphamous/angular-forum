import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { MediaAccessLevel, MediaAssetEntity } from "./entities/media-asset.entity";
import { MediaVariantEntity } from "./entities/media-variant.entity";
import { MediaProcessingService } from "./media-processing.service";
import { MediaStorageService } from "./media-storage.service";

export interface UploadMediaDto {
    sourceModule: string;
    category?: string;
    accessLevel?: MediaAccessLevel;
    altText?: string;
    tags?: string[];
}

export interface QueryMediaDto {
    ownerId?: string;
    sourceModule?: string;
    category?: string;
    mimeType?: string;
    search?: string;
    page?: number;
    limit?: number;
}

export interface EnrichedMediaAsset {
    id: string;
    ownerId: string;
    ownerName: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    width: number | null;
    height: number | null;
    duration: number | null;
    sourceModule: string;
    category: string | null;
    accessLevel: MediaAccessLevel;
    altText: string | null;
    tags: string[];
    isProcessed: boolean;
    url: string;
    variants: {
        variantKey: string;
        mimeType: string;
        fileSize: number;
        width: number | null;
        height: number | null;
        url: string;
    }[];
    createdAt: string;
}

@Injectable()
export class MediaService {
    private readonly logger = new Logger(MediaService.name);

    constructor(
        @InjectRepository(MediaAssetEntity)
        private readonly assetRepo: Repository<MediaAssetEntity>,
        @InjectRepository(MediaVariantEntity)
        private readonly variantRepo: Repository<MediaVariantEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly storageService: MediaStorageService,
        private readonly processingService: MediaProcessingService
    ) {}

    async upload(file: Express.Multer.File, ownerId: string, dto: UploadMediaDto): Promise<EnrichedMediaAsset> {
        if (!file || !file.buffer) {
            throw new BadRequestException("No file provided");
        }

        const checksum = this.storageService.computeChecksum(file.buffer);

        // Checksum dedup: if same owner already has an asset with the same checksum, return it
        const existing = await this.assetRepo.findOne({
            where: { ownerId, checksum }
        });
        if (existing) {
            const existingVariants = await this.variantRepo.find({ where: { assetId: existing.id } });
            return this.enrichAsset(existing, existingVariants);
        }

        // Store original file
        const relativePath = this.storageService.buildRelativePath(ownerId, file.originalname);
        const storageResult = await this.storageService.put(relativePath, file.buffer);

        // Create asset record
        const asset = this.assetRepo.create({
            ownerId,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            checksum,
            sourceModule: dto.sourceModule,
            category: dto.category,
            accessLevel: dto.accessLevel ?? "public",
            storageBackend: storageResult.storageBackend,
            storagePath: storageResult.storagePath,
            altText: dto.altText,
            tags: dto.tags ?? [],
            isProcessed: false
        });

        // Extract image metadata if applicable
        if (this.processingService.isImage(file.mimetype)) {
            const metadata = await this.processingService.extractImageMetadata(file.buffer);
            if (metadata) {
                asset.width = metadata.width;
                asset.height = metadata.height;
                asset.metadata = { format: metadata.format };
            }
        }

        const savedAsset = await this.assetRepo.save(asset);

        // Generate variants for images
        const savedVariants: MediaVariantEntity[] = [];
        if (this.processingService.isImage(file.mimetype)) {
            try {
                const processedVariants = await this.processingService.generateImageVariants(file.buffer);
                for (const pv of processedVariants) {
                    const variantPath = this.storageService.buildRelativePath(
                        ownerId,
                        `${pv.variantKey}-${file.originalname}`
                    );
                    const variantResult = await this.storageService.put(variantPath, pv.buffer);

                    const variant = this.variantRepo.create({
                        assetId: savedAsset.id,
                        variantKey: pv.variantKey,
                        mimeType: pv.mimeType,
                        fileSize: pv.buffer.length,
                        width: pv.width,
                        height: pv.height,
                        storagePath: variantResult.storagePath
                    });
                    savedVariants.push(await this.variantRepo.save(variant));
                }

                savedAsset.isProcessed = true;
                await this.assetRepo.save(savedAsset);
            } catch (err) {
                this.logger.error("Error generating variants for asset " + savedAsset.id, err);
            }
        }

        // Videos: keep isProcessed = false (future phase with ffmpeg)

        return this.enrichAsset(savedAsset, savedVariants);
    }

    async findById(id: string): Promise<EnrichedMediaAsset> {
        const asset = await this.assetRepo.findOne({ where: { id } });
        if (!asset) {
            throw new NotFoundException("Media asset not found");
        }
        const variants = await this.variantRepo.find({ where: { assetId: id } });
        return this.enrichAsset(asset, variants);
    }

    async findByUser(
        ownerId: string,
        page: number,
        limit: number
    ): Promise<{ data: EnrichedMediaAsset[]; total: number }> {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(100, Math.max(1, limit));

        const [assets, total] = await this.assetRepo.findAndCount({
            where: { ownerId },
            order: { createdAt: "DESC" },
            skip: (safePage - 1) * safeLimit,
            take: safeLimit
        });

        const data = await Promise.all(
            assets.map(async (asset) => {
                const variants = await this.variantRepo.find({ where: { assetId: asset.id } });
                return this.enrichAsset(asset, variants);
            })
        );

        return { data, total };
    }

    async browse(
        dto: QueryMediaDto,
        viewerId: string | undefined,
        isAdmin: boolean
    ): Promise<{ data: EnrichedMediaAsset[]; total: number }> {
        const safePage = Math.max(1, dto.page ?? 1);
        const safeLimit = Math.min(100, Math.max(1, dto.limit ?? 20));

        const qb = this.assetRepo.createQueryBuilder("asset").where("asset.deleted_at IS NULL");

        // Access control: non-admins can only see public and unlisted, plus their own
        if (!isAdmin) {
            if (viewerId) {
                qb.andWhere("(asset.access_level IN (:...publicLevels) OR asset.owner_id = :viewerId)", {
                    publicLevels: ["public", "unlisted", "members_only"],
                    viewerId
                });
            } else {
                qb.andWhere("asset.access_level IN (:...publicLevels)", {
                    publicLevels: ["public", "unlisted"]
                });
            }
        }

        if (dto.ownerId) {
            qb.andWhere("asset.owner_id = :ownerId", { ownerId: dto.ownerId });
        }
        if (dto.sourceModule) {
            qb.andWhere("asset.source_module = :sourceModule", { sourceModule: dto.sourceModule });
        }
        if (dto.category) {
            qb.andWhere("asset.category = :category", { category: dto.category });
        }
        if (dto.mimeType) {
            qb.andWhere("asset.mime_type LIKE :mimeType", { mimeType: `${dto.mimeType}%` });
        }
        if (dto.search) {
            qb.andWhere("(asset.original_filename ILIKE :search OR asset.alt_text ILIKE :search)", {
                search: `%${dto.search}%`
            });
        }

        qb.orderBy("asset.created_at", "DESC");
        qb.skip((safePage - 1) * safeLimit).take(safeLimit);

        const [assets, total] = await qb.getManyAndCount();

        const data = await Promise.all(
            assets.map(async (asset) => {
                const variants = await this.variantRepo.find({ where: { assetId: asset.id } });
                return this.enrichAsset(asset, variants);
            })
        );

        return { data, total };
    }

    async updateAsset(
        id: string,
        userId: string,
        isAdmin: boolean,
        patch: { altText?: string; tags?: string[]; category?: string; accessLevel?: MediaAccessLevel }
    ): Promise<EnrichedMediaAsset> {
        const asset = await this.assetRepo.findOne({ where: { id } });
        if (!asset) {
            throw new NotFoundException("Media asset not found");
        }
        if (asset.ownerId !== userId && !isAdmin) {
            throw new ForbiddenException("You can only update your own media assets");
        }

        if (patch.altText !== undefined) asset.altText = patch.altText;
        if (patch.tags !== undefined) asset.tags = patch.tags;
        if (patch.category !== undefined) asset.category = patch.category;
        if (patch.accessLevel !== undefined) asset.accessLevel = patch.accessLevel;

        const updated = await this.assetRepo.save(asset);
        const variants = await this.variantRepo.find({ where: { assetId: id } });
        return this.enrichAsset(updated, variants);
    }

    async deleteAsset(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const asset = await this.assetRepo.findOne({ where: { id } });
        if (!asset) {
            throw new NotFoundException("Media asset not found");
        }
        if (asset.ownerId !== userId && !isAdmin) {
            throw new ForbiddenException("You can only delete your own media assets");
        }

        await this.assetRepo.softDelete(id);
    }

    async changeAccess(
        id: string,
        userId: string,
        isAdmin: boolean,
        accessLevel: MediaAccessLevel
    ): Promise<EnrichedMediaAsset> {
        const asset = await this.assetRepo.findOne({ where: { id } });
        if (!asset) {
            throw new NotFoundException("Media asset not found");
        }
        if (asset.ownerId !== userId && !isAdmin) {
            throw new ForbiddenException("You can only change access on your own media assets");
        }

        asset.accessLevel = accessLevel;
        const updated = await this.assetRepo.save(asset);
        const variants = await this.variantRepo.find({ where: { assetId: id } });
        return this.enrichAsset(updated, variants);
    }

    private async enrichAsset(asset: MediaAssetEntity, variants: MediaVariantEntity[]): Promise<EnrichedMediaAsset> {
        let ownerName = "Unknown";
        try {
            const owner = await this.userRepo.findOne({ where: { id: asset.ownerId }, select: ["displayName"] });
            if (owner) {
                ownerName = owner.displayName;
            }
        } catch {
            this.logger.warn(`Could not resolve owner name for user ${asset.ownerId}`);
        }

        return {
            id: asset.id,
            ownerId: asset.ownerId,
            ownerName,
            originalFilename: asset.originalFilename,
            mimeType: asset.mimeType,
            fileSize: Number(asset.fileSize),
            width: asset.width ?? null,
            height: asset.height ?? null,
            duration: asset.duration ?? null,
            sourceModule: asset.sourceModule,
            category: asset.category ?? null,
            accessLevel: asset.accessLevel,
            altText: asset.altText ?? null,
            tags: asset.tags,
            isProcessed: asset.isProcessed,
            url: this.storageService.getPublicUrl(asset.storagePath),
            variants: variants.map((v) => ({
                variantKey: v.variantKey,
                mimeType: v.mimeType,
                fileSize: Number(v.fileSize),
                width: v.width ?? null,
                height: v.height ?? null,
                url: this.storageService.getPublicUrl(v.storagePath)
            })),
            createdAt: asset.createdAt.toISOString()
        };
    }
}
