import { BadRequestException, Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/auth.decorators";
import { EmbedService, LinkEmbedDto } from "./embed.service";

@ApiTags("Media")
@Controller("embeds")
export class EmbedController {
    constructor(private readonly embedService: EmbedService) {}

    @Public()
    @Get()
    resolve(@Query("url") url: string): Promise<LinkEmbedDto> {
        if (!url) throw new BadRequestException("url query parameter is required");
        return this.embedService.resolve(url);
    }

    @Public()
    @Post("batch")
    resolveBatch(@Body() dto: { urls: string[] }): Promise<LinkEmbedDto[]> {
        if (!dto.urls?.length) throw new BadRequestException("urls array is required");
        return this.embedService.resolveMany(dto.urls);
    }
}
