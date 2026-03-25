import { NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ObjectLiteral, Repository } from "typeorm";

import { NotificationsService } from "../notifications/notifications.service";
import { PushService } from "../push/push.service";
import { UserEntity } from "../user/entities/user.entity";
import { ConversationEntity } from "./entities/conversation.entity";
import { MessageEntity } from "./entities/message.entity";
import { MessagesService } from "./messages.service";

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

const mockNotificationsService = (): Partial<Record<keyof NotificationsService, jest.Mock>> => ({
    create: jest.fn()
});

const mockPushService = (): Partial<Record<keyof PushService, jest.Mock>> => ({
    sendToConversation: jest.fn()
});

describe("MessagesService", () => {
    let service: MessagesService;
    let conversationRepo: ReturnType<typeof createMockRepo<ConversationEntity>>;
    let messageRepo: ReturnType<typeof createMockRepo<MessageEntity>>;
    let userRepo: ReturnType<typeof createMockRepo<UserEntity>>;
    let notificationsService: ReturnType<typeof mockNotificationsService>;
    let pushService: ReturnType<typeof mockPushService>;

    const now = new Date("2026-03-01T10:00:00Z");

    const makeConversation = (overrides: Partial<ConversationEntity> = {}): Partial<ConversationEntity> => ({
        id: "conv-1",
        participantIds: ["user-1", "user-2"],
        subject: "Test Subject",
        lastMessagePreview: "Hello",
        lastMessageAt: now,
        initiatedByUserId: "user-1",
        createdAt: now,
        ...overrides
    });

    const makeMessage = (overrides: Partial<MessageEntity> = {}): Partial<MessageEntity> => ({
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "user-1",
        recipientId: null,
        subject: null,
        content: "Hello there",
        isDraft: false,
        readByUserIds: ["user-1"],
        createdAt: now,
        updatedAt: now,
        ...overrides
    });

    const makeUser = (overrides: Partial<UserEntity> = {}): Partial<UserEntity> => ({
        id: "user-1",
        username: "testuser",
        displayName: "Test User",
        avatarUrl: "avatar.png",
        ...overrides
    });

    beforeEach(async () => {
        jest.clearAllMocks();
        conversationRepo = createMockRepo<ConversationEntity>();
        messageRepo = createMockRepo<MessageEntity>();
        userRepo = createMockRepo<UserEntity>();
        notificationsService = mockNotificationsService();
        pushService = mockPushService();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MessagesService,
                { provide: getRepositoryToken(ConversationEntity), useValue: conversationRepo },
                { provide: getRepositoryToken(MessageEntity), useValue: messageRepo },
                { provide: getRepositoryToken(UserEntity), useValue: userRepo },
                { provide: NotificationsService, useValue: notificationsService },
                { provide: PushService, useValue: pushService }
            ]
        }).compile();

        service = module.get<MessagesService>(MessagesService);
    });

    describe("getConversations", () => {
        it("should return enriched conversations for user", async () => {
            const conv = makeConversation();
            const mockQb = {
                where: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([conv])
            };
            conversationRepo.createQueryBuilder!.mockReturnValue(mockQb);
            userRepo.findBy!.mockResolvedValue([
                makeUser({ id: "user-1" }),
                makeUser({ id: "user-2", username: "other" })
            ]);

            const unreadQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(2)
            };
            messageRepo.createQueryBuilder!.mockReturnValue(unreadQb);

            const result = await service.getConversations("user-1");

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe("conv-1");
            expect(result[0].unreadCount).toBe(2);
        });
    });

    describe("getConversation", () => {
        it("should return conversation detail with messages", async () => {
            const conv = makeConversation();
            conversationRepo.findOneBy!.mockResolvedValue(conv);

            const messages = [makeMessage({ readByUserIds: ["user-1"] })];
            const msgQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(messages)
            };
            messageRepo.createQueryBuilder!.mockReturnValue(msgQb);
            messageRepo.update!.mockResolvedValue({ affected: 1 });
            userRepo.findBy!.mockResolvedValue([
                makeUser({ id: "user-1" }),
                makeUser({ id: "user-2", username: "other", displayName: "Other" })
            ]);

            const unreadQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0)
            };
            // Second call for enrichConversation
            messageRepo.createQueryBuilder!.mockReturnValueOnce(msgQb).mockReturnValue(unreadQb);

            const result = await service.getConversation("user-1", "conv-1");

            expect(result.conversation.id).toBe("conv-1");
            expect(result.messages).toHaveLength(1);
        });

        it("should throw NotFoundException when conversation not found", async () => {
            conversationRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.getConversation("user-1", "missing")).rejects.toThrow(NotFoundException);
        });

        it("should throw NotFoundException when user is not a participant", async () => {
            const conv = makeConversation({ participantIds: ["user-2", "user-3"] });
            conversationRepo.findOneBy!.mockResolvedValue(conv);

            await expect(service.getConversation("user-1", "conv-1")).rejects.toThrow(NotFoundException);
        });
    });

    describe("createConversation", () => {
        it("should create conversation with initial message", async () => {
            const conv = makeConversation();
            conversationRepo.create!.mockReturnValue(conv);
            conversationRepo.save!.mockResolvedValue(conv);
            const msg = makeMessage();
            messageRepo.create!.mockReturnValue(msg);
            messageRepo.save!.mockResolvedValue(msg);
            userRepo.findOneBy!.mockResolvedValue(makeUser());
            userRepo.findBy!.mockResolvedValue([makeUser({ id: "user-1" }), makeUser({ id: "user-2" })]);

            const unreadQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0)
            };
            messageRepo.createQueryBuilder!.mockReturnValue(unreadQb);

            const result = await service.createConversation("user-1", "user-2", "Subject", "Hello!");

            expect(conversationRepo.create).toHaveBeenCalled();
            expect(messageRepo.create).toHaveBeenCalled();
            expect(notificationsService.create).toHaveBeenCalled();
            expect(result.id).toBe("conv-1");
        });

        it("should create conversation without initial message", async () => {
            const conv = makeConversation({ lastMessagePreview: null, lastMessageAt: null });
            conversationRepo.create!.mockReturnValue(conv);
            conversationRepo.save!.mockResolvedValue(conv);
            userRepo.findBy!.mockResolvedValue([makeUser({ id: "user-1" }), makeUser({ id: "user-2" })]);

            const unreadQb = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getCount: jest.fn().mockResolvedValue(0)
            };
            messageRepo.createQueryBuilder!.mockReturnValue(unreadQb);

            const result = await service.createConversation("user-1", "user-2");

            expect(messageRepo.create).not.toHaveBeenCalled();
            expect(notificationsService.create).not.toHaveBeenCalled();
            expect(result).toBeDefined();
        });
    });

    describe("sendMessage", () => {
        it("should send a message and notify participants", async () => {
            const conv = makeConversation();
            conversationRepo.findOneBy!.mockResolvedValue(conv);
            const msg = makeMessage();
            messageRepo.create!.mockReturnValue(msg);
            messageRepo.save!.mockResolvedValue(msg);
            conversationRepo.update!.mockResolvedValue({ affected: 1 });
            userRepo.findOneBy!.mockResolvedValue(makeUser());

            const result = await service.sendMessage("user-1", "conv-1", "Hello!");

            expect(messageRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    conversationId: "conv-1",
                    senderId: "user-1",
                    content: "Hello!",
                    isDraft: false
                })
            );
            expect(pushService.sendToConversation).toHaveBeenCalled();
            expect(notificationsService.create).toHaveBeenCalled();
            expect(result.id).toBe("msg-1");
        });

        it("should throw NotFoundException when conversation not found", async () => {
            conversationRepo.findOneBy!.mockResolvedValue(null);

            await expect(service.sendMessage("user-1", "missing", "Hi")).rejects.toThrow(NotFoundException);
        });

        it("should throw NotFoundException when user not participant", async () => {
            const conv = makeConversation({ participantIds: ["user-2", "user-3"] });
            conversationRepo.findOneBy!.mockResolvedValue(conv);

            await expect(service.sendMessage("user-1", "conv-1", "Hi")).rejects.toThrow(NotFoundException);
        });
    });

    describe("getDrafts", () => {
        it("should return user drafts", async () => {
            const drafts = [makeMessage({ isDraft: true, recipientId: "user-2", subject: "Draft" })];
            messageRepo.find!.mockResolvedValue(drafts);

            const result = await service.getDrafts("user-1");

            expect(result).toHaveLength(1);
            expect(messageRepo.find).toHaveBeenCalledWith({
                where: { senderId: "user-1", isDraft: true },
                order: { updatedAt: "DESC" }
            });
        });
    });

    describe("saveDraft", () => {
        it("should save a new draft", async () => {
            const draft = makeMessage({ isDraft: true, content: "Draft content" });
            messageRepo.create!.mockReturnValue(draft);
            messageRepo.save!.mockResolvedValue(draft);

            const result = await service.saveDraft("user-1", { content: "Draft content" });

            expect(messageRepo.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    senderId: "user-1",
                    content: "Draft content",
                    isDraft: true
                })
            );
            expect(result.content).toBe("Draft content");
        });
    });

    describe("updateDraft", () => {
        it("should update an existing draft", async () => {
            const draft = makeMessage({ isDraft: true });
            messageRepo.findOne!.mockResolvedValue(draft);
            messageRepo.save!.mockImplementation((d) => Promise.resolve(d));

            const result = await service.updateDraft("user-1", "msg-1", { content: "Updated" });

            expect(draft.content).toBe("Updated");
            expect(result).toBeDefined();
        });

        it("should throw NotFoundException when draft not found", async () => {
            messageRepo.findOne!.mockResolvedValue(null);

            await expect(service.updateDraft("user-1", "missing", { content: "x" })).rejects.toThrow(NotFoundException);
        });
    });

    describe("deleteDraft", () => {
        it("should delete the draft", async () => {
            const draft = makeMessage({ isDraft: true });
            messageRepo.findOne!.mockResolvedValue(draft);
            messageRepo.delete!.mockResolvedValue({ affected: 1 });

            await service.deleteDraft("user-1", "msg-1");

            expect(messageRepo.delete).toHaveBeenCalledWith("msg-1");
        });

        it("should throw NotFoundException when draft not found", async () => {
            messageRepo.findOne!.mockResolvedValue(null);

            await expect(service.deleteDraft("user-1", "missing")).rejects.toThrow(NotFoundException);
        });
    });
});
