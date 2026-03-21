import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import { GroupEntity } from "./entities/group.entity";
import { PagePermissionEntity } from "./entities/page-permission.entity";

export interface GroupRef {
    id: string;
    name: string;
}

export interface PagePermissionDto {
    category: string;
    createdAt: string;
    groups: GroupRef[];
    id: string;
    name: string;
    route: string;
    updatedAt: string;
}

export interface CreatePagePermissionDto {
    category?: string;
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
        category: perm.category,
        createdAt: perm.createdAt.toISOString(),
        groups: (perm.groups ?? []).map((g) => ({ id: g.id, name: g.name })),
        id: perm.id,
        name: perm.name,
        route: perm.route,
        updatedAt: perm.updatedAt.toISOString()
    };
}

@Injectable()
export class PagePermissionService implements OnModuleInit {
    private readonly logger = new Logger(PagePermissionService.name);

    constructor(
        @InjectRepository(PagePermissionEntity)
        private readonly permRepo: Repository<PagePermissionEntity>,
        @InjectRepository(GroupEntity)
        private readonly groupRepo: Repository<GroupEntity>
    ) {}

    async onModuleInit(): Promise<void> {
        try {
            await this.seedDefaults();
        } catch (err) {
            this.logger.error("Failed to seed default page permissions", err instanceof Error ? err.stack : err);
        }
    }

    async seedDefaults(): Promise<void> {
        const defaults: { route: string; name: string; category: string; defaultGroup: string }[] = [
            // Community
            { route: "feed", name: "Feed", category: "Community", defaultGroup: "Registrierte Benutzer" },
            { route: "chronik", name: "Chronik", category: "Community", defaultGroup: "Registrierte Benutzer" },
            { route: "friends", name: "Freunde", category: "Community", defaultGroup: "Registrierte Benutzer" },
            { route: "messages", name: "Nachrichten", category: "Community", defaultGroup: "Registrierte Benutzer" },
            { route: "blog", name: "Blog", category: "Community", defaultGroup: "Registrierte Benutzer" },
            { route: "gallery", name: "Galerie", category: "Community", defaultGroup: "Registrierte Benutzer" },
            { route: "calendar", name: "Kalender", category: "Community", defaultGroup: "Registrierte Benutzer" },
            { route: "links", name: "Link-Datenbank", category: "Community", defaultGroup: "Registrierte Benutzer" },
            // Forum
            { route: "forum", name: "Forum", category: "Forum", defaultGroup: "Registrierte Benutzer" },
            // Anime
            {
                route: "anime-database",
                name: "Anime-Datenbank",
                category: "Anime",
                defaultGroup: "Registrierte Benutzer"
            },
            {
                route: "anime-top-list",
                name: "Anime Top-Liste",
                category: "Anime",
                defaultGroup: "Registrierte Benutzer"
            },
            {
                route: "anime/my-list",
                name: "Meine Animeliste",
                category: "Anime",
                defaultGroup: "Registrierte Benutzer"
            },
            // Gamification
            { route: "shop", name: "Shop", category: "Gamification", defaultGroup: "Registrierte Benutzer" },
            { route: "lotto", name: "Lotto", category: "Gamification", defaultGroup: "Registrierte Benutzer" },
            {
                route: "market",
                name: "Dynamischer Markt",
                category: "Gamification",
                defaultGroup: "Registrierte Benutzer"
            },
            {
                route: "tcg",
                name: "Trading Card Game",
                category: "Gamification",
                defaultGroup: "Registrierte Benutzer"
            },
            // Marketplace
            { route: "marketplace", name: "Marktplatz", category: "Marktplatz", defaultGroup: "Registrierte Benutzer" },
            // User
            {
                route: "profile",
                name: "Profil bearbeiten",
                category: "Benutzer",
                defaultGroup: "Registrierte Benutzer"
            },
            { route: "dashboard", name: "Dashboard", category: "Benutzer", defaultGroup: "Registrierte Benutzer" },
            // Admin
            { route: "admin/overview", name: "Admin Übersicht", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/forum", name: "Forum Verwaltung", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/users", name: "Benutzer Verwaltung", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/groups", name: "Gruppen Verwaltung", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/permissions", name: "Berechtigungen", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/gamification", name: "Gamification", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/achievements", name: "Achievements", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/slideshow", name: "Slideshow", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/shop", name: "Shop Verwaltung", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/calendar", name: "Kalender Verwaltung", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/lotto", name: "Lotto Verwaltung", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/blog", name: "Blog Verwaltung", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/coins", name: "Coins Verwaltung", category: "Administration", defaultGroup: "Admin" },
            {
                route: "admin/marketplace",
                name: "Marktplatz Verwaltung",
                category: "Administration",
                defaultGroup: "Admin"
            },
            { route: "admin/feed", name: "Feed Verwaltung", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/community-bot", name: "Community Bot", category: "Administration", defaultGroup: "Admin" },
            {
                route: "admin/link-database",
                name: "Link-DB Verwaltung",
                category: "Administration",
                defaultGroup: "Admin"
            },
            { route: "admin/market", name: "Markt Verwaltung", category: "Administration", defaultGroup: "Admin" },
            { route: "admin/tcg", name: "TCG Verwaltung", category: "Administration", defaultGroup: "Admin" }
        ];

        for (const def of defaults) {
            const exists = await this.permRepo.findOneBy({ route: def.route });
            if (!exists) {
                const group = await this.groupRepo.findOneBy({ name: def.defaultGroup });
                const perm = this.permRepo.create({
                    route: def.route,
                    name: def.name,
                    category: def.category,
                    groups: group ? [group] : []
                });
                await this.permRepo.save(perm);
                this.logger.log(`Seeded permission: ${def.name} (${def.route})`);
            }
        }
    }

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
        const perm = this.permRepo.create({
            name: dto.name,
            route: dto.route,
            category: dto.category ?? "Allgemein",
            groups
        });
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
