import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { GamificationService } from "../gamification/gamification.service";
import { MediaService } from "../media/media.service";
import { QuestService } from "../rpg/quest.service";
import { UserEntity } from "../user/entities/user.entity";
import { GalleryAlbumEntity } from "./entities/gallery-album.entity";
import { GalleryCommentEntity } from "./entities/gallery-comment.entity";
import { GalleryMediaEntity } from "./entities/gallery-media.entity";
import { GalleryRatingEntity } from "./entities/gallery-rating.entity";

export interface CreateAlbumDto {
    title: string;
    description?: string;
    category?: string;
    accessLevel?: "public" | "members_only" | "private";
    password?: string;
    watermarkEnabled?: boolean;
    allowComments?: boolean;
    allowRatings?: boolean;
    allowDownload?: boolean;
    tags?: string[];
}

export interface AddMediaDto {
    type: "image" | "video" | "youtube";
    url: string;
    mediaAssetId?: string;
    youtubeId?: string;
    title?: string;
    description?: string;
    filename?: string;
    mimeType?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    takenAt?: string;
    latitude?: number;
    longitude?: number;
    sortOrder?: number;
}

@Injectable()
export class GalleryService {
    constructor(
        @InjectRepository(GalleryAlbumEntity)
        private readonly albumRepo: Repository<GalleryAlbumEntity>,
        @InjectRepository(GalleryMediaEntity)
        private readonly mediaRepo: Repository<GalleryMediaEntity>,
        @InjectRepository(GalleryCommentEntity)
        private readonly commentRepo: Repository<GalleryCommentEntity>,
        @InjectRepository(GalleryRatingEntity)
        private readonly ratingRepo: Repository<GalleryRatingEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly gamificationService: GamificationService,
        private readonly mediaService: MediaService,
        private readonly questService: QuestService
    ) {}

    async getAlbums(userId: string, isAdmin: boolean): Promise<object[]> {
        const qb = this.albumRepo.createQueryBuilder("a");

        if (!isAdmin) {
            qb.where("a.accessLevel = 'public' OR a.accessLevel = 'members_only' OR a.ownerId = :userId", { userId });
        }

        const albums = await qb.orderBy("a.createdAt", "DESC").getMany();
        const result = await Promise.all(albums.map((a) => this.enrichAlbum(a, userId)));
        return result;
    }

    async getAlbum(id: string, userId: string, isAdmin: boolean, password?: string): Promise<object> {
        const album = await this.albumRepo.findOne({ where: { id } });
        if (!album) throw new NotFoundException("Album not found");

        if (!isAdmin && album.accessLevel === "private" && album.ownerId !== userId) {
            if (album.password && album.password !== password) {
                throw new ForbiddenException("Invalid password");
            }
            if (!album.password) throw new ForbiddenException("Access denied");
        }

        const media = await this.mediaRepo.find({
            where: { albumId: id },
            order: { sortOrder: "ASC", createdAt: "ASC" }
        });

        const enrichedMedia = await Promise.all(media.map((m) => this.enrichMedia(m, userId)));
        const enrichedAlbum = await this.enrichAlbum(album, userId);

        return { ...enrichedAlbum, media: enrichedMedia };
    }

    async createAlbum(ownerId: string, dto: CreateAlbumDto): Promise<GalleryAlbumEntity> {
        const album = this.albumRepo.create({
            ownerId,
            title: dto.title,
            description: dto.description ?? null,
            category: dto.category ?? null,
            accessLevel: dto.accessLevel ?? "public",
            password: dto.password ?? null,
            watermarkEnabled: dto.watermarkEnabled ?? false,
            allowComments: dto.allowComments ?? true,
            allowRatings: dto.allowRatings ?? true,
            allowDownload: dto.allowDownload ?? true,
            tags: dto.tags ?? []
        });
        return this.albumRepo.save(album);
    }

    async updateAlbum(id: string, userId: string, isAdmin: boolean, dto: CreateAlbumDto): Promise<GalleryAlbumEntity> {
        const album = await this.albumRepo.findOne({ where: { id } });
        if (!album) throw new NotFoundException("Album not found");
        if (!isAdmin && album.ownerId !== userId) throw new ForbiddenException("Access denied");

        Object.assign(album, {
            title: dto.title ?? album.title,
            description: dto.description !== undefined ? dto.description : album.description,
            category: dto.category !== undefined ? dto.category : album.category,
            accessLevel: dto.accessLevel ?? album.accessLevel,
            password: dto.password !== undefined ? dto.password : album.password,
            watermarkEnabled: dto.watermarkEnabled ?? album.watermarkEnabled,
            allowComments: dto.allowComments ?? album.allowComments,
            allowRatings: dto.allowRatings ?? album.allowRatings,
            allowDownload: dto.allowDownload ?? album.allowDownload,
            tags: dto.tags ?? album.tags
        });

        return this.albumRepo.save(album);
    }

    async deleteAlbum(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const album = await this.albumRepo.findOne({ where: { id } });
        if (!album) throw new NotFoundException("Album not found");
        if (!isAdmin && album.ownerId !== userId) throw new ForbiddenException("Access denied");
        await this.albumRepo.delete(id);
    }

    async addMedia(albumId: string, ownerId: string, dto: AddMediaDto): Promise<GalleryMediaEntity> {
        const album = await this.albumRepo.findOne({ where: { id: albumId } });
        if (!album) throw new NotFoundException("Album not found");

        let resolvedUrl = dto.url;
        if (dto.mediaAssetId) {
            const asset = await this.mediaService.findById(dto.mediaAssetId);
            resolvedUrl = asset.url;
        }

        const media = this.mediaRepo.create({
            albumId,
            ownerId,
            type: dto.type,
            url: resolvedUrl,
            mediaAssetId: dto.mediaAssetId ?? undefined,
            youtubeId: dto.youtubeId ?? null,
            title: dto.title ?? null,
            description: dto.description ?? null,
            filename: dto.filename ?? null,
            mimeType: dto.mimeType ?? null,
            fileSize: dto.fileSize ?? null,
            width: dto.width ?? null,
            height: dto.height ?? null,
            takenAt: dto.takenAt ? new Date(dto.takenAt) : null,
            latitude: dto.latitude ?? null,
            longitude: dto.longitude ?? null,
            sortOrder: dto.sortOrder ?? 0
        });

        const saved = await this.mediaRepo.save(media);
        void this.gamificationService.awardXp(ownerId, "upload_gallery", saved.id);
        void this.questService.trackProgress(ownerId, "upload_gallery").catch(() => undefined);
        return saved;
    }

    async deleteMedia(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const media = await this.mediaRepo.findOne({ where: { id } });
        if (!media) throw new NotFoundException("Media not found");
        if (!isAdmin && media.ownerId !== userId) throw new ForbiddenException("Access denied");
        await this.mediaRepo.delete(id);
    }

    async getComments(mediaId: string): Promise<object[]> {
        const comments = await this.commentRepo.find({
            where: { mediaId },
            order: { createdAt: "ASC" }
        });

        return Promise.all(
            comments.map(async (c) => {
                const author = await this.userRepo.findOne({ where: { id: c.authorId } });
                return {
                    id: c.id,
                    mediaId: c.mediaId,
                    authorId: c.authorId,
                    authorName: author ? author.displayName || author.username : "Unknown",
                    authorAvatar: author?.avatarUrl ?? null,
                    content: c.content,
                    createdAt: c.createdAt
                };
            })
        );
    }

    async addComment(mediaId: string, authorId: string, content: string): Promise<GalleryCommentEntity> {
        const media = await this.mediaRepo.findOne({ where: { id: mediaId } });
        if (!media) throw new NotFoundException("Media not found");
        const comment = this.commentRepo.create({ mediaId, authorId, content });
        return this.commentRepo.save(comment);
    }

    async updateComment(id: string, userId: string, isAdmin: boolean, content: string): Promise<object> {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment) throw new NotFoundException("Comment not found");
        if (!isAdmin && comment.authorId !== userId) throw new ForbiddenException("Access denied");
        comment.content = content;
        const saved = await this.commentRepo.save(comment);
        const author = await this.userRepo.findOne({ where: { id: saved.authorId } });
        return {
            id: saved.id,
            mediaId: saved.mediaId,
            authorId: saved.authorId,
            authorName: author ? author.displayName || author.username : "Unknown",
            authorAvatar: author?.avatarUrl ?? null,
            content: saved.content,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt
        };
    }

    async deleteComment(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment) throw new NotFoundException("Comment not found");
        if (!isAdmin && comment.authorId !== userId) throw new ForbiddenException("Access denied");
        await this.commentRepo.delete(id);
    }

    async rateMedia(mediaId: string, userId: string, rating: number): Promise<void> {
        const media = await this.mediaRepo.findOne({ where: { id: mediaId } });
        if (!media) throw new NotFoundException("Media not found");

        const existing = await this.ratingRepo.findOne({ where: { mediaId, userId } });
        if (existing) {
            await this.ratingRepo.update(existing.id, { rating });
        } else {
            await this.ratingRepo.save(this.ratingRepo.create({ mediaId, userId, rating }));
        }
    }

    private async enrichAlbum(album: GalleryAlbumEntity, userId: string): Promise<object> {
        const owner = await this.userRepo.findOne({ where: { id: album.ownerId } });
        const mediaCount = await this.mediaRepo.count({ where: { albumId: album.id } });

        let coverUrl: string | null = null;
        if (album.coverMediaId) {
            const cover = await this.mediaRepo.findOne({ where: { id: album.coverMediaId } });
            coverUrl = cover?.url ?? null;
        } else {
            const first = await this.mediaRepo.findOne({ where: { albumId: album.id }, order: { sortOrder: "ASC" } });
            coverUrl = first?.url ?? null;
        }

        return {
            id: album.id,
            title: album.title,
            description: album.description,
            category: album.category,
            coverUrl,
            ownerId: album.ownerId,
            ownerName: owner ? owner.displayName || owner.username : "Unknown",
            ownerAvatar: owner?.avatarUrl ?? null,
            accessLevel: album.accessLevel,
            watermarkEnabled: album.watermarkEnabled,
            allowComments: album.allowComments,
            allowRatings: album.allowRatings,
            allowDownload: album.allowDownload,
            tags: album.tags,
            mediaCount,
            isOwner: album.ownerId === userId,
            createdAt: album.createdAt,
            updatedAt: album.updatedAt
        };
    }

    private async enrichMedia(media: GalleryMediaEntity, userId: string): Promise<object> {
        const commentCount = await this.commentRepo.count({ where: { mediaId: media.id } });
        const ratings = await this.ratingRepo.find({ where: { mediaId: media.id } });
        const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;
        const userRatingEntry = ratings.find((r) => r.userId === userId);

        return {
            id: media.id,
            albumId: media.albumId,
            ownerId: media.ownerId,
            type: media.type,
            url: media.url,
            youtubeId: media.youtubeId,
            title: media.title,
            description: media.description,
            filename: media.filename,
            mimeType: media.mimeType,
            fileSize: media.fileSize,
            width: media.width,
            height: media.height,
            takenAt: media.takenAt,
            latitude: media.latitude,
            longitude: media.longitude,
            sortOrder: media.sortOrder,
            commentCount,
            averageRating: Math.round(averageRating * 10) / 10,
            userRating: userRatingEntry?.rating ?? null,
            isOwner: media.ownerId === userId,
            createdAt: media.createdAt
        };
    }
}
