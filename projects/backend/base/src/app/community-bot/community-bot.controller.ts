import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";

import { CommunityBotService } from "./community-bot.service";
import { CreateBotDto, UpdateBotDto } from "./dto/create-bot.dto";

@Controller("community-bot")
export class CommunityBotController {
    constructor(private readonly service: CommunityBotService) {}

    @Get()
    findAll() {
        return this.service.findAll();
    }

    @Get("stats")
    getStats() {
        return this.service.getStats();
    }

    @Get("logs")
    getLogs(@Query("limit") limit?: string, @Query("offset") offset?: string, @Query("botId") botId?: string) {
        return this.service.getLogs(limit ? Number(limit) : 100, offset ? Number(offset) : 0, botId);
    }

    @Delete("logs")
    clearLogs(@Query("days") days?: string) {
        return this.service.clearLogs(days ? Number(days) : 30);
    }

    @Get("queue")
    getQueue() {
        return this.service.getQueue();
    }

    @Get(":id")
    findOne(@Param("id") id: string) {
        return this.service.findOne(id);
    }

    @Post()
    create(@Body() dto: CreateBotDto) {
        return this.service.create(dto);
    }

    @Patch(":id")
    update(@Param("id") id: string, @Body() dto: UpdateBotDto) {
        return this.service.update(id, dto);
    }

    @Patch(":id/toggle")
    toggle(@Param("id") id: string) {
        return this.service.toggleEnabled(id);
    }

    @Post(":id/test")
    test(@Param("id") id: string) {
        return this.service.testBot(id);
    }

    @Delete(":id")
    remove(@Param("id") id: string) {
        return this.service.remove(id);
    }
}
