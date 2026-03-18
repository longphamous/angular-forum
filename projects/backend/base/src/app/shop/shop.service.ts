import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { CreditService } from "../credit/credit.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ShopItemEntity } from "./entities/shop-item.entity";
import { UserInventoryEntity } from "./entities/user-inventory.entity";

export interface ShopItemDto {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    icon: string | null;
    category: string | null;
    isActive: boolean;
    stock: number | null;
    maxPerUser: number | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface UserInventoryDto {
    id: string;
    userId: string;
    itemId: string;
    item: ShopItemDto;
    quantity: number;
    purchasedAt: string;
}

export interface CreateShopItemDto {
    name: string;
    description?: string | null;
    price: number;
    imageUrl?: string | null;
    icon?: string | null;
    category?: string | null;
    isActive?: boolean;
    stock?: number | null;
    maxPerUser?: number | null;
    sortOrder?: number;
}

export type UpdateShopItemDto = Partial<CreateShopItemDto>;

function toItemDto(e: ShopItemEntity): ShopItemDto {
    return {
        id: e.id,
        name: e.name,
        description: e.description,
        price: e.price,
        imageUrl: e.imageUrl,
        icon: e.icon,
        category: e.category,
        isActive: e.isActive,
        stock: e.stock,
        maxPerUser: e.maxPerUser,
        sortOrder: e.sortOrder,
        createdAt: e.createdAt.toISOString(),
        updatedAt: e.updatedAt.toISOString()
    };
}

@Injectable()
export class ShopService {
    constructor(
        @InjectRepository(ShopItemEntity)
        private readonly itemRepo: Repository<ShopItemEntity>,
        @InjectRepository(UserInventoryEntity)
        private readonly inventoryRepo: Repository<UserInventoryEntity>,
        private readonly creditService: CreditService,
        private readonly notificationsService: NotificationsService
    ) {}

    // ─── Public ───────────────────────────────────────────────────────────────

    async findActive(): Promise<ShopItemDto[]> {
        const items = await this.itemRepo.find({
            where: { isActive: true },
            order: { sortOrder: "ASC", createdAt: "ASC" }
        });
        return items.map(toItemDto);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    async findAll(): Promise<ShopItemDto[]> {
        const items = await this.itemRepo.find({ order: { sortOrder: "ASC", createdAt: "ASC" } });
        return items.map(toItemDto);
    }

    async create(dto: CreateShopItemDto): Promise<ShopItemDto> {
        const item = this.itemRepo.create({
            name: dto.name,
            description: dto.description ?? null,
            price: dto.price,
            imageUrl: dto.imageUrl ?? null,
            icon: dto.icon ?? null,
            category: dto.category ?? null,
            isActive: dto.isActive ?? true,
            stock: dto.stock ?? null,
            maxPerUser: dto.maxPerUser ?? null,
            sortOrder: dto.sortOrder ?? 0
        });
        return toItemDto(await this.itemRepo.save(item));
    }

    async update(id: string, dto: UpdateShopItemDto): Promise<ShopItemDto> {
        const item = await this.itemRepo.findOneBy({ id });
        if (!item) throw new NotFoundException("Shop item not found");
        Object.assign(item, {
            ...(dto.name !== undefined && { name: dto.name }),
            ...(dto.description !== undefined && { description: dto.description }),
            ...(dto.price !== undefined && { price: dto.price }),
            ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
            ...(dto.icon !== undefined && { icon: dto.icon }),
            ...(dto.category !== undefined && { category: dto.category }),
            ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            ...(dto.stock !== undefined && { stock: dto.stock }),
            ...(dto.maxPerUser !== undefined && { maxPerUser: dto.maxPerUser }),
            ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder })
        });
        return toItemDto(await this.itemRepo.save(item));
    }

    async delete(id: string): Promise<void> {
        const item = await this.itemRepo.findOneBy({ id });
        if (!item) throw new NotFoundException("Shop item not found");
        await this.itemRepo.remove(item);
    }

    // ─── Purchase ─────────────────────────────────────────────────────────────

    async purchaseItem(userId: string, itemId: string): Promise<UserInventoryDto> {
        const item = await this.itemRepo.findOneBy({ id: itemId, isActive: true });
        if (!item) throw new NotFoundException("Shop item not found or not available");

        if (item.stock !== null && item.stock <= 0) {
            throw new BadRequestException("This item is out of stock");
        }

        if (item.maxPerUser !== null) {
            const owned = await this.inventoryRepo.count({ where: { userId, itemId } });
            if (owned >= item.maxPerUser) {
                throw new BadRequestException(`You can only own ${item.maxPerUser} of this item`);
            }
        }

        await this.creditService.deductCredits(userId, item.price, "purchase", `Shop purchase: ${item.name}`);

        await this.notificationsService.create(
            userId,
            "system",
            "Einkauf bestätigt",
            `${item.name} wurde erfolgreich gekauft.`,
            "/shop"
        );

        if (item.stock !== null) {
            item.stock -= 1;
            await this.itemRepo.save(item);
        }

        const existing = await this.inventoryRepo.findOne({ where: { userId, itemId } });
        if (existing) {
            existing.quantity += 1;
            const saved = await this.inventoryRepo.save(existing);
            return this.toInventoryDto(saved, item);
        }

        const entry = this.inventoryRepo.create({ userId, itemId, quantity: 1 });
        const saved = await this.inventoryRepo.save(entry);
        return this.toInventoryDto(saved, item);
    }

    // ─── Inventory ────────────────────────────────────────────────────────────

    async getUserInventory(userId: string): Promise<UserInventoryDto[]> {
        const entries = await this.inventoryRepo.find({ where: { userId }, order: { purchasedAt: "DESC" } });
        if (!entries.length) return [];

        const itemIds = [...new Set(entries.map((e) => e.itemId))];
        const items = await this.itemRepo.findByIds(itemIds);
        const itemMap = new Map(items.map((i) => [i.id, i]));

        return entries.filter((e) => itemMap.has(e.itemId)).map((e) => this.toInventoryDto(e, itemMap.get(e.itemId)!));
    }

    async getAllInventory(): Promise<UserInventoryDto[]> {
        const entries = await this.inventoryRepo.find({ order: { purchasedAt: "DESC" } });
        if (!entries.length) return [];

        const itemIds = [...new Set(entries.map((e) => e.itemId))];
        const items = await this.itemRepo.findByIds(itemIds);
        const itemMap = new Map(items.map((i) => [i.id, i]));

        return entries.filter((e) => itemMap.has(e.itemId)).map((e) => this.toInventoryDto(e, itemMap.get(e.itemId)!));
    }

    private toInventoryDto(e: UserInventoryEntity, item: ShopItemEntity): UserInventoryDto {
        return {
            id: e.id,
            userId: e.userId,
            itemId: e.itemId,
            item: toItemDto(item),
            quantity: e.quantity,
            purchasedAt: e.purchasedAt.toISOString()
        };
    }
}
