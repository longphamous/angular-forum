import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { GalleryAlbumEntity } from "./entities/gallery-album.entity";
import { GalleryCommentEntity } from "./entities/gallery-comment.entity";
import { GalleryMediaEntity } from "./entities/gallery-media.entity";
import { GalleryRatingEntity } from "./entities/gallery-rating.entity";
import { GalleryService } from "./gallery.service";

const createMockRepo = <T extends ObjectLiteral>(): Partial<Record<keyof Repository<T>, jest.Mock>> => ({
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    findBy: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn()
});

describe("GalleryService", () => {
    let service: GalleryService;
    let albumRepo: ReturnType<typeof createMockRepo<GalleryAlbumEntity>>;
    let mediaRepo: ReturnType<typeof createMockRepo<GalleryMediaEntity>>;
    let commentRepo: ReturnType<typeof createMockRepo<GalleryCommentEntity>>;
    let ratingRepo: ReturnType<typeof createMockRepo<GalleryRatingEntity>>;
    let userRepo: ReturnType<typeof createMockRepo<UserEntity>>;

    const now = new Date("2026-03-01T10:00:00Z");

    const makeAlbum = (overrides: Partial<GalleryAlbumEntity> = {}): Partial<GalleryAlbumEntity> => ({
        id: "album-1",
        ownerId: "user-1",
        title: "My Album",
        description: "A nice album",
        category: "photos",
        accessLevel: "public",
        password: null,
        coverMediaId: null,
        watermarkEnabled: false,
        allowComments: true,
        allowRatings: true,
        allowDownload: true,
        tags: [],
        createdAt: now,
        updatedAt: now,
        ...overrides
    });

    const makeMedia = (overrides: Partial<GalleryMediaEntity> = {}): Partial<GalleryMediaEntity> => ({
        id: "media-1",
        albumId: "album-1",
        ownerId: "user-1",
        type: "image",
        url: "https://example.com/photo.jpg",
        youtubeId: null,
        title: "Photo",
        description: null,
        filename: "photo.jpg",
        mimeType: "image/jpeg",
        fileSize: 1024,
        width: 800,
        height: 600,
        takenAt: null,
        latitude: null,
        longitude: null,
        sortOrder: 0,
        createdAt: now,
        ...overrides
    });

    const makeComment = (overrides: Partial<GalleryCommentEntity> = {}): Partial<GalleryCommentEntity> => ({
        id: "comment-1",
        mediaId: "media-1",
        authorId: "user-1",
        content: "Nice photo!",
        createdAt: now,
        ...overrides
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        albumRepo = createMockRepo<GalleryAlbumEntity>();
        mediaRepo = createMockRepo<GalleryMediaEntity>();
        commentRepo = createMockRepo<GalleryCommentEntity>();
        ratingRepo = createMockRepo<GalleryRatingEntity>();
        userRepo = createMockRepo<UserEntity>();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GalleryService,
                { provide: getRepositoryToken(GalleryAlbumEntity), useValue: albumRepo },
                { provide: getRepositoryToken(GalleryMediaEntity), useValue: mediaRepo },
                { provide: getRepositoryToken(GalleryCommentEntity), useValue: commentRepo },
                { provide: getRepositoryToken(GalleryRatingEntity), useValue: ratingRepo },
                { provide: getRepositoryToken(UserEntity), useValue: userRepo }
            ]
        }).compile();

        service = module.get<GalleryService>(GalleryService);
    });

    describe("getAlbums", () => {
        it("should return enriched albums for non-admin", async () => {
            const mockQb = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([makeAlbum()])
            };
            albumRepo.createQueryBuilder!.mockReturnValue(mockQb);
            userRepo.findOne!.mockResolvedValue({
                id: "user-1",
                displayName: "Owner",
                username: "owner",
                avatarUrl: null
            });
            mediaRepo.count!.mockResolvedValue(5);
            mediaRepo.findOne!.mockResolvedValue(makeMedia());

            const result = await service.getAlbums("user-1", false);

            expect(result).toHaveLength(1);
            expect(mockQb.where).toHaveBeenCalled();
        });

        it("should return all albums for admin", async () => {
            const mockQb = {
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([makeAlbum()])
            };
            albumRepo.createQueryBuilder!.mockReturnValue(mockQb);
            userRepo.findOne!.mockResolvedValue({
                id: "user-1",
                displayName: "Owner",
                username: "owner",
                avatarUrl: null
            });
            mediaRepo.count!.mockResolvedValue(0);
            mediaRepo.findOne!.mockResolvedValue(null);

            const result = await service.getAlbums("admin", true);

            expect(result).toHaveLength(1);
        });
    });

    describe("getAlbum", () => {
        it("should return album with media for owner", async () => {
            albumRepo.findOne!.mockResolvedValue(makeAlbum());
            mediaRepo.find!.mockResolvedValue([makeMedia()]);
            userRepo.findOne!.mockResolvedValue({
                id: "user-1",
                displayName: "Owner",
                username: "owner",
                avatarUrl: null
            });
            mediaRepo.count!.mockResolvedValue(1);
            mediaRepo.findOne!.mockResolvedValue(makeMedia());
            commentRepo.count!.mockResolvedValue(0);
            ratingRepo.find!.mockResolvedValue([]);

            const result = await service.getAlbum("album-1", "user-1", false);

            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when album not found", async () => {
            albumRepo.findOne!.mockResolvedValue(null);

            await expect(service.getAlbum("missing", "user-1", false)).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException for private album without access", async () => {
            albumRepo.findOne!.mockResolvedValue(
                makeAlbum({ accessLevel: "private", ownerId: "user-2", password: null })
            );

            await expect(service.getAlbum("album-1", "user-1", false)).rejects.toThrow(ForbiddenException);
        });

        it("should throw ForbiddenException for private album with wrong password", async () => {
            albumRepo.findOne!.mockResolvedValue(
                makeAlbum({ accessLevel: "private", ownerId: "user-2", password: "secret" })
            );

            await expect(service.getAlbum("album-1", "user-1", false, "wrong")).rejects.toThrow(ForbiddenException);
        });
    });

    describe("createAlbum", () => {
        it("should create and save an album", async () => {
            const album = makeAlbum();
            albumRepo.create!.mockReturnValue(album);
            albumRepo.save!.mockResolvedValue(album);

            const result = await service.createAlbum("user-1", { title: "My Album" });

            expect(albumRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({ ownerId: "user-1", title: "My Album" })
            );
            expect(result).toBeDefined();
        });
    });

    describe("updateAlbum", () => {
        it("should update album when owner edits", async () => {
            const album = makeAlbum({ ownerId: "user-1" });
            albumRepo.findOne!.mockResolvedValue(album);
            albumRepo.save!.mockImplementation((a) => Promise.resolve(a));

            const result = await service.updateAlbum("album-1", "user-1", false, {
                title: "Updated Album"
            });

            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when album not found", async () => {
            albumRepo.findOne!.mockResolvedValue(null);

            await expect(service.updateAlbum("missing", "user-1", false, { title: "X" })).rejects.toThrow(
                NotFoundException
            );
        });

        it("should throw ForbiddenException when non-owner non-admin edits", async () => {
            albumRepo.findOne!.mockResolvedValue(makeAlbum({ ownerId: "user-1" }));

            await expect(service.updateAlbum("album-1", "user-2", false, { title: "X" })).rejects.toThrow(
                ForbiddenException
            );
        });

        it("should allow admin to update any album", async () => {
            const album = makeAlbum({ ownerId: "user-1" });
            albumRepo.findOne!.mockResolvedValue(album);
            albumRepo.save!.mockImplementation((a) => Promise.resolve(a));

            await expect(
                service.updateAlbum("album-1", "user-2", true, { title: "Admin Update" })
            ).resolves.toBeDefined();
        });
    });

    describe("deleteAlbum", () => {
        it("should delete album when owner deletes", async () => {
            const album = makeAlbum({ ownerId: "user-1" });
            albumRepo.findOne!.mockResolvedValue(album);
            albumRepo.delete!.mockResolvedValue({ affected: 1 });

            await service.deleteAlbum("album-1", "user-1", false);

            expect(albumRepo.delete).toHaveBeenCalledWith("album-1");
        });

        it("should throw NotFoundException when album not found", async () => {
            albumRepo.findOne!.mockResolvedValue(null);

            await expect(service.deleteAlbum("missing", "user-1", false)).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when non-owner non-admin deletes", async () => {
            albumRepo.findOne!.mockResolvedValue(makeAlbum({ ownerId: "user-1" }));

            await expect(service.deleteAlbum("album-1", "user-2", false)).rejects.toThrow(ForbiddenException);
        });
    });

    describe("addMedia", () => {
        it("should add media to an album", async () => {
            albumRepo.findOne!.mockResolvedValue(makeAlbum());
            const media = makeMedia();
            mediaRepo.create!.mockReturnValue(media);
            mediaRepo.save!.mockResolvedValue(media);

            const result = await service.addMedia("album-1", "user-1", {
                type: "image",
                url: "https://example.com/photo.jpg"
            });

            expect(result).toBeDefined();
            expect(mediaRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    albumId: "album-1",
                    ownerId: "user-1",
                    type: "image"
                })
            );
        });

        it("should throw NotFoundException when album not found", async () => {
            albumRepo.findOne!.mockResolvedValue(null);

            await expect(service.addMedia("missing", "user-1", { type: "image", url: "test.jpg" })).rejects.toThrow(
                NotFoundException
            );
        });
    });

    describe("deleteMedia", () => {
        it("should delete media when owner deletes", async () => {
            mediaRepo.findOne!.mockResolvedValue(makeMedia({ ownerId: "user-1" }));
            mediaRepo.delete!.mockResolvedValue({ affected: 1 });

            await service.deleteMedia("media-1", "user-1", false);

            expect(mediaRepo.delete).toHaveBeenCalledWith("media-1");
        });

        it("should throw NotFoundException when media not found", async () => {
            mediaRepo.findOne!.mockResolvedValue(null);

            await expect(service.deleteMedia("missing", "user-1", false)).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when non-owner non-admin deletes", async () => {
            mediaRepo.findOne!.mockResolvedValue(makeMedia({ ownerId: "user-1" }));

            await expect(service.deleteMedia("media-1", "user-2", false)).rejects.toThrow(ForbiddenException);
        });
    });

    describe("addComment", () => {
        it("should add a comment to media", async () => {
            mediaRepo.findOne!.mockResolvedValue(makeMedia());
            const comment = makeComment();
            commentRepo.create!.mockReturnValue(comment);
            commentRepo.save!.mockResolvedValue(comment);

            const result = await service.addComment("media-1", "user-1", "Nice photo!");

            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when media not found", async () => {
            mediaRepo.findOne!.mockResolvedValue(null);

            await expect(service.addComment("missing", "user-1", "Nice!")).rejects.toThrow(NotFoundException);
        });
    });

    describe("deleteComment", () => {
        it("should delete comment when owner deletes", async () => {
            commentRepo.findOne!.mockResolvedValue(makeComment({ authorId: "user-1" }));
            commentRepo.delete!.mockResolvedValue({ affected: 1 });

            await service.deleteComment("comment-1", "user-1", false);

            expect(commentRepo.delete).toHaveBeenCalledWith("comment-1");
        });

        it("should throw NotFoundException when comment not found", async () => {
            commentRepo.findOne!.mockResolvedValue(null);

            await expect(service.deleteComment("missing", "user-1", false)).rejects.toThrow(NotFoundException);
        });

        it("should throw ForbiddenException when non-owner non-admin deletes", async () => {
            commentRepo.findOne!.mockResolvedValue(makeComment({ authorId: "user-1" }));

            await expect(service.deleteComment("comment-1", "user-2", false)).rejects.toThrow(ForbiddenException);
        });
    });

    describe("rateMedia", () => {
        it("should create a new rating", async () => {
            mediaRepo.findOne!.mockResolvedValue(makeMedia());
            ratingRepo.findOne!.mockResolvedValue(null);
            ratingRepo.create!.mockReturnValue({ mediaId: "media-1", userId: "user-1", rating: 5 });
            ratingRepo.save!.mockResolvedValue({ mediaId: "media-1", userId: "user-1", rating: 5 });

            await service.rateMedia("media-1", "user-1", 5);

            expect(ratingRepo.save).toHaveBeenCalled();
        });

        it("should update an existing rating", async () => {
            mediaRepo.findOne!.mockResolvedValue(makeMedia());
            ratingRepo.findOne!.mockResolvedValue({ id: "rating-1", mediaId: "media-1", userId: "user-1", rating: 3 });
            ratingRepo.update!.mockResolvedValue({ affected: 1 });

            await service.rateMedia("media-1", "user-1", 5);

            expect(ratingRepo.update).toHaveBeenCalledWith("rating-1", { rating: 5 });
        });

        it("should throw NotFoundException when media not found", async () => {
            mediaRepo.findOne!.mockResolvedValue(null);

            await expect(service.rateMedia("missing", "user-1", 5)).rejects.toThrow(NotFoundException);
        });
    });
});
