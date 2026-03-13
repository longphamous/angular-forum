import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { GroupEntity } from "./entities/group.entity";
import { PagePermissionEntity } from "./entities/page-permission.entity";

export interface GroupRef {
    id: string;
    name: string;
}

export interface PagePermissionDto {
    createdAt: string;
    groups: GroupRef[];
    id: string;
    name: string;
    route: string;
    updatedAt: string;
}

export interface CreatePagePermissionDto {
    groupIds?: string[];
    name: string;
    route: string;
}

export interface UpdatePagePermissionDto {
    name?: string;
    route?: string;
}

function toDto(perm: PagePermissionEntity): PagePermissionDto {
    return {
        createdAt: perm.createdAt.toISOString(),
        groups: (perm.groups ?? []).map((g) => ({ id: g.id, name: g.name })),
        id: perm.id,
        name: perm.name,
        route: perm.route,
        updatedAt: perm.updatedAt.toISOString()
    };
}

@Injectable()
export class PagePermissionService {
    constructor(
        @InjectRepository(PagePermissionEntity)
        private readonly permRepo: Repository<PagePermissionEntity>,
        @InjectRepository(GroupEntity)
        private readonly groupRepo: Repository<GroupEntity>
    ) {}

    async findAll(): Promise<PagePermissionDto[]> {
        const perms = await this.permRepo.find({ relations: { groups: true }, order: { route: "ASC" } });
        return perms.map(toDto);
    }

    async findOne(id: string): Promise<PagePermissionDto> {
        return toDto(await this.findById(id));
    }

    async create(dto: CreatePagePermissionDto): Promise<PagePermissionDto> {
        if (await this.permRepo.existsBy({ route: dto.route })) {
            throw new BadRequestException(`Permission for route "${dto.route}" already exists`);
        }
        const groups = dto.groupIds?.length ? await this.groupRepo.findBy({ id: In(dto.groupIds) }) : [];
        const perm = this.permRepo.create({ name: dto.name, route: dto.route, groups });
        await this.permRepo.save(perm);
        return toDto(perm);
    }

    async update(id: string, dto: UpdatePagePermissionDto): Promise<PagePermissionDto> {
        const perm = await this.findById(id);
        if (dto.name !== undefined) perm.name = dto.name;
        if (dto.route !== undefined) perm.route = dto.route;
        await this.permRepo.save(perm);
        return toDto(perm);
    }

    async remove(id: string): Promise<void> {
        const perm = await this.findById(id);
        await this.permRepo.remove(perm);
    }

    async setGroups(id: string, groupIds: string[]): Promise<PagePermissionDto> {
        const perm = await this.findById(id);
        const groups = await this.groupRepo.findBy({ id: In(groupIds) });
        perm.groups = groups;
        await this.permRepo.save(perm);
        return toDto(perm);
    }

    async findByRoute(route: string): Promise<PagePermissionDto | null> {
        const perm = await this.permRepo.findOne({ where: { route }, relations: { groups: true } });
        return perm ? toDto(perm) : null;
    }

    private async findById(id: string): Promise<PagePermissionEntity> {
        const perm = await this.permRepo.findOne({ where: { id }, relations: { groups: true } });
        if (!perm) throw new NotFoundException(`Permission "${id}" not found`);
        return perm;
    }
}
