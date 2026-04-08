import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { ActivityModule } from "./activity/activity.module";
import { AdminLogsModule } from "./admin-logs/admin-logs.module";
import { AnimeModule } from "./anime/anime.module";
import { AnimeListModule } from "./anime/anime-list.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { BlogModule } from "./blog/blog.module";
import { CalendarModule } from "./calendar/calendar.module";
import { ChronikModule } from "./chronik/chronik.module";
import { ClanModule } from "./clan/clan.module";
import { ClipsModule } from "./clips/clips.module";
import { CommunityBotModule } from "./community-bot/community-bot.module";
import { CreditModule } from "./credit/credit.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { EmbedModule } from "./embed/embed.module";
import { FeedModule } from "./feed/feed.module";
import { MangaModule } from "./manga/manga.module";
import { ForumModule } from "./forum/forum.module";
import { FriendsModule } from "./friends/friends.module";
import { GalleryModule } from "./gallery/gallery.module";
import { GamificationModule } from "./gamification/gamification.module";
import { HashtagModule } from "./hashtag/hashtag.module";
import { TcgModule } from "./gamification/tcg/tcg.module";
import { GroupModule } from "./group/group.module";
import { I18nModule } from "./i18n/i18n.module";
import { LexiconModule } from "./lexicon/lexicon.module";
import { LinkDatabaseModule } from "./link-database/link-database.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { MediaModule } from "./media/media.module";
import { MessagesModule } from "./messages/messages.module";
import { ModerationModule } from "./moderation/moderation.module";
import { ModuleConfigModule } from "./module-config/module-config.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PushModule } from "./push/push.module";
import { RecipesModule } from "./recipes/recipes.module";
import { RpgModule } from "./rpg/rpg.module";
import { ShopModule } from "./shop/shop.module";
import { SlideshowModule } from "./slideshow/slideshow.module";
import { SteamModule } from "./steam/steam.module";
import { TicketModule } from "./ticket/ticket.module";
import { UserModule } from "./user/user.module";
import { WeatherModule } from "./weather/weather.module";

@Module({
    imports: [
        // Config must be first so other modules can use environment variables
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ["projects/backend/base/.env", ".env"]
        }),
        DatabaseModule,
        ActivityModule,
        AdminLogsModule,
        AuthModule,
        GamificationModule,
        HashtagModule,
        I18nModule,
        CreditModule,
        UserModule,
        AnimeModule,
        AnimeListModule,
        ForumModule,
        ClanModule,
        GroupModule,
        SlideshowModule,
        ShopModule,
        RpgModule,
        CalendarModule,
        DashboardModule,
        GalleryModule,
        NotificationsModule,
        PushModule.register(),
        MessagesModule,
        ModerationModule,
        ModuleConfigModule,
        BlogModule,
        ChronikModule,
        MarketplaceModule,
        MediaModule,
        FeedModule,
        FriendsModule,
        CommunityBotModule,
        LexiconModule,
        LinkDatabaseModule,
        RecipesModule,
        SteamModule,
        TcgModule,
        TicketModule,
        WeatherModule,
        ClipsModule,
        EmbedModule,
        MangaModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
