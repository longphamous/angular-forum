import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { UserEntity } from "../../user/entities/user.entity";
import { TicketAttachmentEntity } from "../entities/ticket-attachment.entity";
import type { AttachmentDto } from "../models/ticket.model";

@Injectable()
export class TicketAttachmentService {
    constructor(
        @InjectRepository(TicketAttachmentEntity) private readonly attachmentRepo: Repository<TicketAttachmentEntity>,
        @InjectRepository(UserEntity) private readonly userRepo: Repository<UserEntity>
    ) {}

    async getAttachments(ticketId: string): Promise<AttachmentDto[]> {
        const attachments = await this.attachmentRepo.find({
            where: { ticketId },
            order: { createdAt: "DESC" }
        });
        const userIds = [...new Set(attachments.map((a) => a.uploadedBy))];
        const userMap = await this.getUserMap(userIds);
        return attachments.map((a) => this.toDto(a, userMap));
    }

    async addAttachment(ticketId: string, userId: string, file: { fileName: string; filePath: string; fileSize: number; mimeType?: string }): Promise<AttachmentDto> {
        const attachment = this.attachmentRepo.create({
            ticketId,
            fileName: file.fileName,
            filePath: file.filePath,
            fileSize: file.fileSize,
            mimeType: file.mimeType,
            uploadedBy: userId
        });
        const saved = await this.attachmentRepo.save(attachment);
        const userMap = await this.getUserMap([userId]);
        return this.toDto(saved, userMap);
    }

    async deleteAttachment(id: string): Promise<void> {
        const attachment = await this.attachmentRepo.findOne({ where: { id } });
        if (!attachment) throw new NotFoundException(`Attachment "${id}" not found`);
        await this.attachmentRepo.remove(attachment);
    }

    async getAttachmentCount(ticketId: string): Promise<number> {
        return this.attachmentRepo.count({ where: { ticketId } });
    }

    private toDto(a: TicketAttachmentEntity, userMap: Map<string, string>): AttachmentDto {
        return {
            id: a.id,
            ticketId: a.ticketId,
            fileName: a.fileName,
            filePath: a.filePath,
            fileSize: a.fileSize,
            mimeType: a.mimeType,
            uploadedBy: a.uploadedBy,
            uploadedByName: userMap.get(a.uploadedBy),
            createdAt: a.createdAt.toISOString()
        };
    }

    private async getUserMap(ids: string[]): Promise<Map<string, string>> {
        if (!ids.length) return new Map();
        const users = await this.userRepo.findBy({ id: In([...new Set(ids)]) });
        return new Map(users.map((u) => [u.id, u.displayName]));
    }
}
