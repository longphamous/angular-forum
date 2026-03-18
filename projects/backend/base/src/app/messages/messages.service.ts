import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { NotificationsService } from "../notifications/notifications.service";
import { PushMessageNew } from "../push/push-event.types";
import { PushService } from "../push/push.service";
import { UserEntity } from "../user/entities/user.entity";
import { ConversationEntity } from "./entities/conversation.entity";
import { MessageEntity } from "./entities/message.entity";

export interface ConversationParticipantDto {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl?: string;
}

export interface ConversationDto {
    id: string;
    participantIds: string[];
    participants: ConversationParticipantDto[];
    subject: string | null;
    lastMessage: string;
    lastMessageAt: string;
    unreadCount: number;
    initiatedByUserId: string;
    createdAt: string;
}

export interface MessageDto {
    id: string;
    conversationId: string | null;
    senderId: string;
    senderName: string;
    content: string;
    isDraft: boolean;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationDetailDto {
    conversation: ConversationDto;
    messages: MessageDto[];
}

export interface DraftDto {
    id: string;
    conversationId?: string;
    recipientId?: string;
    subject?: string;
    content: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(ConversationEntity)
        private readonly conversationRepo: Repository<ConversationEntity>,
        @InjectRepository(MessageEntity)
        private readonly messageRepo: Repository<MessageEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>,
        private readonly notificationsService: NotificationsService,
        private readonly pushService: PushService
    ) {}

    async getConversations(userId: string): Promise<ConversationDto[]> {
        const conversations = await this.conversationRepo
            .createQueryBuilder("c")
            .where(":userId = ANY(c.participantIds)", { userId })
            .orderBy("c.lastMessageAt", "DESC", "NULLS LAST")
            .getMany();

        return Promise.all(conversations.map((c) => this.enrichConversation(c, userId)));
    }

    async getConversation(userId: string, convId: string): Promise<ConversationDetailDto> {
        const conv = await this.conversationRepo.findOneBy({ id: convId });
        if (!conv || !conv.participantIds.includes(userId)) {
            throw new NotFoundException("Conversation not found");
        }

        const messages = await this.messageRepo
            .createQueryBuilder("m")
            .where("m.conversationId = :convId", { convId })
            .andWhere("m.isDraft = false")
            .orderBy("m.createdAt", "ASC")
            .getMany();

        // Mark messages as read
        const unread = messages.filter((m) => !m.readByUserIds.includes(userId) && m.senderId !== userId);
        for (const msg of unread) {
            await this.messageRepo.update(msg.id, { readByUserIds: [...msg.readByUserIds, userId] });
        }

        const participants = await this.userRepo.findBy({ id: In(conv.participantIds) });
        const userMap = new Map(participants.map((u) => [u.id, u]));

        return {
            conversation: await this.enrichConversation(conv, userId),
            messages: messages.map((m) => ({
                id: m.id,
                conversationId: m.conversationId,
                senderId: m.senderId,
                senderName: userMap.get(m.senderId)?.displayName ?? userMap.get(m.senderId)?.username ?? "Unknown",
                content: m.content,
                isDraft: m.isDraft,
                isRead: m.readByUserIds.includes(userId),
                createdAt: m.createdAt.toISOString(),
                updatedAt: m.updatedAt.toISOString()
            }))
        };
    }

    async createConversation(
        userId: string,
        recipientId: string,
        subject?: string,
        content?: string
    ): Promise<ConversationDto> {
        const conv = this.conversationRepo.create({
            participantIds: [userId, recipientId],
            subject: subject ?? null,
            lastMessagePreview: content ? content.slice(0, 100) : null,
            lastMessageAt: content ? new Date() : null,
            initiatedByUserId: userId
        });
        await this.conversationRepo.save(conv);

        if (content) {
            const msg = this.messageRepo.create({
                conversationId: conv.id,
                senderId: userId,
                content,
                isDraft: false,
                readByUserIds: [userId]
            });
            await this.messageRepo.save(msg);

            // Notify recipient
            const sender = await this.userRepo.findOneBy({ id: userId });
            const senderName = sender?.displayName ?? sender?.username ?? "Unbekannt";
            void this.notificationsService.create(
                recipientId,
                "new_message",
                "Neue Nachricht",
                `${senderName} hat dir eine Nachricht gesendet`,
                "/messages"
            );
        }

        return this.enrichConversation(conv, userId);
    }

    async sendMessage(userId: string, convId: string, content: string): Promise<MessageDto> {
        const conv = await this.conversationRepo.findOneBy({ id: convId });
        if (!conv || !conv.participantIds.includes(userId)) {
            throw new NotFoundException("Conversation not found");
        }

        const msg = this.messageRepo.create({
            conversationId: convId,
            senderId: userId,
            content,
            isDraft: false,
            readByUserIds: [userId]
        });
        await this.messageRepo.save(msg);

        await this.conversationRepo.update(convId, {
            lastMessagePreview: content.slice(0, 100),
            lastMessageAt: new Date()
        });

        const sender = await this.userRepo.findOneBy({ id: userId });
        const senderName = sender?.displayName ?? sender?.username ?? "Unknown";

        // Push real-time message to conversation room
        const pushPayload: PushMessageNew = {
            conversationId: convId,
            messageId: msg.id,
            senderId: userId,
            senderName,
            preview: content.slice(0, 100),
            createdAt: msg.createdAt.toISOString()
        };
        this.pushService.sendToConversation(convId, "message:new", pushPayload);

        // Notify all other participants
        for (const recipientId of conv.participantIds.filter((id) => id !== userId)) {
            void this.notificationsService.create(
                recipientId,
                "new_message",
                "Neue Nachricht",
                `${senderName} hat dir eine Nachricht gesendet`,
                "/messages"
            );
        }

        return {
            id: msg.id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            senderName,
            content: msg.content,
            isDraft: false,
            isRead: false,
            createdAt: msg.createdAt.toISOString(),
            updatedAt: msg.updatedAt.toISOString()
        };
    }

    async getDrafts(userId: string): Promise<DraftDto[]> {
        const drafts = await this.messageRepo.find({
            where: { senderId: userId, isDraft: true },
            order: { updatedAt: "DESC" }
        });

        return drafts.map((m) => ({
            id: m.id,
            conversationId: m.conversationId ?? undefined,
            recipientId: m.recipientId ?? undefined,
            subject: m.subject ?? undefined,
            content: m.content,
            createdAt: m.createdAt.toISOString(),
            updatedAt: m.updatedAt.toISOString()
        }));
    }

    async saveDraft(
        userId: string,
        payload: { conversationId?: string; recipientId?: string; subject?: string; content: string }
    ): Promise<DraftDto> {
        const draft = this.messageRepo.create({
            conversationId: payload.conversationId ?? null,
            senderId: userId,
            recipientId: payload.recipientId ?? null,
            subject: payload.subject ?? null,
            content: payload.content,
            isDraft: true,
            readByUserIds: []
        });
        await this.messageRepo.save(draft);

        return {
            id: draft.id,
            conversationId: draft.conversationId ?? undefined,
            recipientId: draft.recipientId ?? undefined,
            subject: draft.subject ?? undefined,
            content: draft.content,
            createdAt: draft.createdAt.toISOString(),
            updatedAt: draft.updatedAt.toISOString()
        };
    }

    async updateDraft(
        userId: string,
        draftId: string,
        payload: { content?: string; subject?: string }
    ): Promise<DraftDto> {
        const draft = await this.messageRepo.findOne({ where: { id: draftId, senderId: userId, isDraft: true } });
        if (!draft) throw new NotFoundException("Draft not found");

        if (payload.content !== undefined) draft.content = payload.content;
        if (payload.subject !== undefined) draft.subject = payload.subject;
        await this.messageRepo.save(draft);

        return {
            id: draft.id,
            conversationId: draft.conversationId ?? undefined,
            recipientId: draft.recipientId ?? undefined,
            subject: draft.subject ?? undefined,
            content: draft.content,
            createdAt: draft.createdAt.toISOString(),
            updatedAt: draft.updatedAt.toISOString()
        };
    }

    async deleteDraft(userId: string, draftId: string): Promise<void> {
        const draft = await this.messageRepo.findOne({ where: { id: draftId, senderId: userId, isDraft: true } });
        if (!draft) throw new NotFoundException("Draft not found");
        await this.messageRepo.delete(draftId);
    }

    // ─── Private helpers ──────────────────────────────────────────────────────

    private async enrichConversation(conv: ConversationEntity, currentUserId: string): Promise<ConversationDto> {
        const participants = await this.userRepo.findBy({ id: In(conv.participantIds) });

        const unreadCount = await this.messageRepo
            .createQueryBuilder("m")
            .where("m.conversationId = :convId", { convId: conv.id })
            .andWhere("NOT(:userId = ANY(m.readByUserIds))", { userId: currentUserId })
            .andWhere("m.isDraft = false")
            .andWhere("m.senderId != :userId", { userId: currentUserId })
            .getCount();

        return {
            id: conv.id,
            participantIds: conv.participantIds,
            participants: participants.map((u) => ({
                userId: u.id,
                username: u.username,
                displayName: u.displayName ?? u.username,
                avatarUrl: u.avatarUrl ?? undefined
            })),
            subject: conv.subject,
            lastMessage: conv.lastMessagePreview ?? "",
            lastMessageAt: conv.lastMessageAt?.toISOString() ?? conv.createdAt.toISOString(),
            unreadCount,
            initiatedByUserId: conv.initiatedByUserId,
            createdAt: conv.createdAt.toISOString()
        };
    }
}
