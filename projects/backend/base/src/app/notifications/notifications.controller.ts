import { Controller, Delete, Get, Param, Patch, Query, Req } from "@nestjs/common";
import { Request } from "express";

import { NotificationEntity } from "./entities/notification.entity";
import { NotificationsService } from "./notifications.service";

@Controller("notifications")
export class NotificationsController {
    constructor(private readonly notifService: NotificationsService) {}

    @Get()
    getNotifications(@Req() req: Request, @Query("limit") limit?: string): Promise<NotificationEntity[]> {
        const user = req.user as { userId: string };
        return this.notifService.getForUser(user.userId, limit ? parseInt(limit, 10) : 30);
    }

    @Get("unread-count")
    async getUnreadCount(@Req() req: Request): Promise<{ count: number }> {
        const user = req.user as { userId: string };
        const count = await this.notifService.getUnreadCount(user.userId);
        return { count };
    }

    @Patch("read-all")
    markAllAsRead(@Req() req: Request): Promise<void> {
        const user = req.user as { userId: string };
        return this.notifService.markAllAsRead(user.userId);
    }

    @Patch(":id/read")
    markAsRead(@Req() req: Request, @Param("id") id: string): Promise<void> {
        const user = req.user as { userId: string };
        return this.notifService.markAsRead(user.userId, id);
    }

    @Delete(":id")
    delete(@Req() req: Request, @Param("id") id: string): Promise<void> {
        const user = req.user as { userId: string };
        return this.notifService.delete(user.userId, id);
    }
}
