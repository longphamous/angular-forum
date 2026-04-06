import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public } from "../auth/auth.decorators";
import { HashtagDto, HashtagSearchResponse, HashtagService } from "./hashtag.service";

@ApiTags("Hashtags")
@ApiBearerAuth("JWT")
@Controller("hashtags")
export class HashtagController {
    constructor(private readonly hashtagService: HashtagService) {}

    @Public()
    @Get("autocomplete")
    autocomplete(@Query("q") q = "", @Query("limit") limit?: string): Promise<HashtagDto[]> {
        return this.hashtagService.autocomplete(q, Number(limit) || 10);
    }

    @Public()
    @Get("trending")
    trending(@Query("limit") limit?: string): Promise<HashtagDto[]> {
        return this.hashtagService.getTrending(Number(limit) || 20);
    }

    @Public()
    @Get(":tag")
    search(
        @Param("tag") tag: string,
        @Query("limit") limit?: string,
        @Query("offset") offset?: string
    ): Promise<HashtagSearchResponse | null> {
        return this.hashtagService.searchByHashtag(tag, Number(limit) || 50, Number(offset) || 0);
    }
}
