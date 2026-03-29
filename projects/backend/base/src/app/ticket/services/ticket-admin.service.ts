import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreateCategoryDto } from "../dto/create-category.dto";
import { CreateLabelDto } from "../dto/create-label.dto";
import { CreateProjectDto } from "../dto/create-project.dto";
import { UpdateProjectDto } from "../dto/update-project.dto";
import { TicketEntity } from "../entities/ticket.entity";
import { TicketCategoryEntity } from "../entities/ticket-category.entity";
import { TicketLabelEntity } from "../entities/ticket-label.entity";
import { TicketProjectEntity } from "../entities/ticket-project.entity";
import type { LabelDto, TicketCategoryDto, TicketProjectDto } from "../models/ticket.model";

@Injectable()
export class TicketAdminService {
    constructor(
        @InjectRepository(TicketProjectEntity) private readonly projectRepo: Repository<TicketProjectEntity>,
        @InjectRepository(TicketCategoryEntity) private readonly categoryRepo: Repository<TicketCategoryEntity>,
        @InjectRepository(TicketLabelEntity) private readonly labelRepo: Repository<TicketLabelEntity>,
        @InjectRepository(TicketEntity) private readonly ticketRepo: Repository<TicketEntity>
    ) {}

    // ── Projects ───────────────────────────────────────────────────────────────

    async getProjects(): Promise<TicketProjectDto[]> {
        const projects = await this.projectRepo.find({ order: { createdAt: "DESC" } });
        const results: TicketProjectDto[] = [];
        for (const p of projects) {
            const [ticketCount, openTicketCount] = await Promise.all([
                this.ticketRepo.count({ where: { projectId: p.id } }),
                this.ticketRepo.count({ where: { projectId: p.id, status: "open" } })
            ]);
            results.push(this.toProjectDto(p, ticketCount, openTicketCount));
        }
        return results;
    }

    async createProject(ownerId: string, dto: CreateProjectDto): Promise<TicketProjectDto> {
        const project = this.projectRepo.create({
            name: dto.name,
            description: dto.description,
            ownerId,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined
        });
        const saved = await this.projectRepo.save(project);
        return this.toProjectDto(saved, 0, 0);
    }

    async updateProject(id: string, dto: UpdateProjectDto): Promise<TicketProjectDto> {
        const project = await this.projectRepo.findOne({ where: { id } });
        if (!project) throw new NotFoundException(`Project "${id}" not found`);

        if (dto.name !== undefined) project.name = dto.name;
        if (dto.description !== undefined) project.description = dto.description;
        if (dto.status !== undefined) project.status = dto.status;
        if (dto.startDate !== undefined) project.startDate = dto.startDate ? new Date(dto.startDate) : undefined;
        if (dto.endDate !== undefined) project.endDate = dto.endDate ? new Date(dto.endDate) : undefined;

        const saved = await this.projectRepo.save(project);
        const [ticketCount, openTicketCount] = await Promise.all([
            this.ticketRepo.count({ where: { projectId: id } }),
            this.ticketRepo.count({ where: { projectId: id, status: "open" } })
        ]);
        return this.toProjectDto(saved, ticketCount, openTicketCount);
    }

    async deleteProject(id: string): Promise<void> {
        const project = await this.projectRepo.findOne({ where: { id } });
        if (!project) throw new NotFoundException(`Project "${id}" not found`);
        await this.projectRepo.remove(project);
    }

    // ── Categories ─────────────────────────────────────────────────────────────

    async getCategories(): Promise<TicketCategoryDto[]> {
        const categories = await this.categoryRepo.find({ order: { position: "ASC" } });
        const results: TicketCategoryDto[] = [];
        for (const c of categories) {
            const ticketCount = await this.ticketRepo.count({ where: { categoryId: c.id } });
            results.push(this.toCategoryDto(c, ticketCount));
        }
        return results;
    }

    async createCategory(dto: CreateCategoryDto): Promise<TicketCategoryDto> {
        const category = this.categoryRepo.create({
            name: dto.name,
            description: dto.description,
            icon: dto.icon,
            color: dto.color,
            position: dto.position ?? 0,
            isActive: dto.isActive ?? true
        });
        const saved = await this.categoryRepo.save(category);
        return this.toCategoryDto(saved, 0);
    }

    async updateCategory(id: string, dto: CreateCategoryDto): Promise<TicketCategoryDto> {
        const category = await this.categoryRepo.findOne({ where: { id } });
        if (!category) throw new NotFoundException(`Category "${id}" not found`);

        if (dto.name !== undefined) category.name = dto.name;
        if (dto.description !== undefined) category.description = dto.description;
        if (dto.icon !== undefined) category.icon = dto.icon;
        if (dto.color !== undefined) category.color = dto.color;
        if (dto.position !== undefined) category.position = dto.position;
        if (dto.isActive !== undefined) category.isActive = dto.isActive;

        const saved = await this.categoryRepo.save(category);
        const ticketCount = await this.ticketRepo.count({ where: { categoryId: id } });
        return this.toCategoryDto(saved, ticketCount);
    }

    async deleteCategory(id: string): Promise<void> {
        const category = await this.categoryRepo.findOne({ where: { id } });
        if (!category) throw new NotFoundException(`Category "${id}" not found`);
        await this.categoryRepo.remove(category);
    }

    // ── Labels ─────────────────────────────────────────────────────────────────

    async getLabels(): Promise<LabelDto[]> {
        const labels = await this.labelRepo.find({ order: { name: "ASC" } });
        return labels.map((l) => ({ id: l.id, name: l.name, color: l.color, categoryId: l.categoryId }));
    }

    async createLabel(dto: CreateLabelDto): Promise<LabelDto> {
        const label = this.labelRepo.create(dto);
        const saved = await this.labelRepo.save(label);
        return { id: saved.id, name: saved.name, color: saved.color, categoryId: saved.categoryId };
    }

    async updateLabel(id: string, dto: CreateLabelDto): Promise<LabelDto> {
        const label = await this.labelRepo.findOne({ where: { id } });
        if (!label) throw new NotFoundException(`Label "${id}" not found`);
        if (dto.name !== undefined) label.name = dto.name;
        if (dto.color !== undefined) label.color = dto.color;
        if (dto.categoryId !== undefined) label.categoryId = dto.categoryId;
        const saved = await this.labelRepo.save(label);
        return { id: saved.id, name: saved.name, color: saved.color, categoryId: saved.categoryId };
    }

    async deleteLabel(id: string): Promise<void> {
        const label = await this.labelRepo.findOne({ where: { id } });
        if (!label) throw new NotFoundException(`Label "${id}" not found`);
        await this.labelRepo.remove(label);
    }

    // ── Private ────────────────────────────────────────────────────────────────

    private toProjectDto(p: TicketProjectEntity, ticketCount: number, openTicketCount: number): TicketProjectDto {
        return {
            id: p.id,
            name: p.name,
            description: p.description,
            status: p.status,
            ownerId: p.ownerId,
            startDate: p.startDate ? (p.startDate as Date).toISOString().split("T")[0] : undefined,
            endDate: p.endDate ? (p.endDate as Date).toISOString().split("T")[0] : undefined,
            ticketCount,
            openTicketCount,
            createdAt: p.createdAt.toISOString(),
            updatedAt: p.updatedAt.toISOString()
        };
    }

    private toCategoryDto(c: TicketCategoryEntity, ticketCount: number): TicketCategoryDto {
        return {
            id: c.id,
            name: c.name,
            description: c.description,
            icon: c.icon,
            color: c.color,
            position: c.position,
            isActive: c.isActive,
            ticketCount
        };
    }
}
