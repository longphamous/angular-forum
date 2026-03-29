import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateCustomFieldDefDto } from "../dto/create-custom-field-def.dto";
import { TicketCustomFieldDefEntity } from "../entities/ticket-custom-field-def.entity";
import type { CustomFieldDefDto } from "../models/ticket.model";

@Injectable()
export class TicketCustomFieldService {
    constructor(
        @InjectRepository(TicketCustomFieldDefEntity) private readonly fieldRepo: Repository<TicketCustomFieldDefEntity>
    ) {}

    async getFields(projectId: string): Promise<CustomFieldDefDto[]> {
        const fields = await this.fieldRepo.find({ where: { projectId }, order: { position: "ASC" } });
        return fields.map((f) => this.toDto(f));
    }

    async createField(dto: CreateCustomFieldDefDto): Promise<CustomFieldDefDto> {
        const field = this.fieldRepo.create({
            projectId: dto.projectId,
            name: dto.name,
            fieldKey: dto.fieldKey,
            fieldType: dto.fieldType,
            options: dto.options,
            required: dto.required ?? false,
            applicableTypes: dto.applicableTypes ?? [],
            position: dto.position ?? 0
        });
        const saved = await this.fieldRepo.save(field);
        return this.toDto(saved);
    }

    async updateField(id: string, dto: Partial<CreateCustomFieldDefDto>): Promise<CustomFieldDefDto> {
        const field = await this.fieldRepo.findOne({ where: { id } });
        if (!field) throw new NotFoundException(`Field "${id}" not found`);

        if (dto.name !== undefined) field.name = dto.name;
        if (dto.fieldKey !== undefined) field.fieldKey = dto.fieldKey;
        if (dto.fieldType !== undefined) field.fieldType = dto.fieldType;
        if (dto.options !== undefined) field.options = dto.options;
        if (dto.required !== undefined) field.required = dto.required;
        if (dto.applicableTypes !== undefined) field.applicableTypes = dto.applicableTypes;
        if (dto.position !== undefined) field.position = dto.position;

        const saved = await this.fieldRepo.save(field);
        return this.toDto(saved);
    }

    async deleteField(id: string): Promise<void> {
        const field = await this.fieldRepo.findOne({ where: { id } });
        if (!field) throw new NotFoundException(`Field "${id}" not found`);
        await this.fieldRepo.remove(field);
    }

    private toDto(f: TicketCustomFieldDefEntity): CustomFieldDefDto {
        return {
            id: f.id,
            projectId: f.projectId,
            name: f.name,
            fieldKey: f.fieldKey,
            fieldType: f.fieldType,
            options: f.options,
            required: f.required,
            applicableTypes: f.applicableTypes,
            position: f.position
        };
    }
}
