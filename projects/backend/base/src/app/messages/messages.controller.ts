import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { Request } from "express";

import { ConversationDetailDto, ConversationDto, DraftDto, MessageDto, MessagesService } from "./messages.service";

@Controller("messages")
export class MessagesController {
    constructor(private readonly messagesService: MessagesService) {}

    // ─── Conversations ────────────────────────────────────────────────────────

    @Get("conversations")
    getConversations(@Req() req: Request): Promise<ConversationDto[]> {
        const user = req.user as { userId: string };
        return this.messagesService.getConversations(user.userId);
    }

    @Post("conversations")
    createConversation(
        @Req() req: Request,
        @Body() body: { recipientId: string; subject?: string; content?: string }
    ): Promise<ConversationDto> {
        const user = req.user as { userId: string };
        return this.messagesService.createConversation(user.userId, body.recipientId, body.subject, body.content);
    }

    @Get("conversations/:id")
    getConversation(@Req() req: Request, @Param("id") id: string): Promise<ConversationDetailDto> {
        const user = req.user as { userId: string };
        return this.messagesService.getConversation(user.userId, id);
    }

    @Post("conversations/:id/messages")
    sendMessage(@Req() req: Request, @Param("id") id: string, @Body() body: { content: string }): Promise<MessageDto> {
        const user = req.user as { userId: string };
        return this.messagesService.sendMessage(user.userId, id, body.content);
    }

    // ─── Drafts ───────────────────────────────────────────────────────────────

    @Get("drafts")
    getDrafts(@Req() req: Request): Promise<DraftDto[]> {
        const user = req.user as { userId: string };
        return this.messagesService.getDrafts(user.userId);
    }

    @Post("drafts")
    saveDraft(
        @Req() req: Request,
        @Body() body: { conversationId?: string; recipientId?: string; subject?: string; content: string }
    ): Promise<DraftDto> {
        const user = req.user as { userId: string };
        return this.messagesService.saveDraft(user.userId, body);
    }

    @Patch("drafts/:id")
    updateDraft(
        @Req() req: Request,
        @Param("id") id: string,
        @Body() body: { content?: string; subject?: string }
    ): Promise<DraftDto> {
        const user = req.user as { userId: string };
        return this.messagesService.updateDraft(user.userId, id, body);
    }

    @Delete("drafts/:id")
    deleteDraft(@Req() req: Request, @Param("id") id: string): Promise<void> {
        const user = req.user as { userId: string };
        return this.messagesService.deleteDraft(user.userId, id);
    }
}
