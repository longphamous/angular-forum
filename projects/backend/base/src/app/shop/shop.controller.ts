import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Request, UseGuards } from "@nestjs/common";

import { Public, Roles } from "../auth/auth.decorators";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CreateShopItemDto, ShopService, UpdateShopItemDto } from "./shop.service";

@Controller("shop")
export class ShopController {
    constructor(private readonly shopService: ShopService) {}

    // ─── Public ───────────────────────────────────────────────────────────────

    @Public()
    @Get()
    findActive() {
        return this.shopService.findActive();
    }

    // ─── Authenticated user routes ────────────────────────────────────────────

    @Post("purchase/:itemId")
    purchase(@Param("itemId", ParseUUIDPipe) itemId: string, @Request() req: { user: { userId: string } }) {
        return this.shopService.purchaseItem(req.user.userId, itemId);
    }

    @Get("inventory")
    getMyInventory(@Request() req: { user: { userId: string } }) {
        return this.shopService.getUserInventory(req.user.userId);
    }

    // ─── Admin routes ─────────────────────────────────────────────────────────

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Get("admin")
    findAll() {
        return this.shopService.findAll();
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Post("admin")
    create(@Body() body: CreateShopItemDto) {
        return this.shopService.create(body);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Patch("admin/:id")
    update(@Param("id", ParseUUIDPipe) id: string, @Body() body: UpdateShopItemDto) {
        return this.shopService.update(id, body);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Delete("admin/:id")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.shopService.delete(id);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Get("admin/inventory/all")
    getAllInventory() {
        return this.shopService.getAllInventory();
    }
}
