import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AdminLogsModule } from "./admin-logs/admin-logs.module";
import { AnimeModule } from "./anime/anime.module";
import { AnimeListModule } from "./anime/anime-list.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { BlogModule } from "./blog/blog.module";
import { CalendarModule } from "./calendar/calendar.module";
import { ChronikModule } from "./chronik/chronik.module";
import { CommunityBotModule } from "./community-bot/community-bot.module";
import { CreditModule } from "./credit/credit.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { FeedModule } from "./feed/feed.module";
import { ForumModule } from "./forum/forum.module";
import { FriendsModule } from "./friends/friends.module";
import { GalleryModule } from "./gallery/gallery.module";
import { GamificationModule } from "./gamification/gamification.module";
import { TcgModule } from "./gamification/tcg/tcg.module";
import { GroupModule } from "./group/group.module";
import { LexiconModule } from "./lexicon/lexicon.module";
import { LinkDatabaseModule } from "./link-database/link-database.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { MessagesModule } from "./messages/messages.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PushModule } from "./push/push.module";
import { ShopModule } from "./shop/shop.module";
import { SlideshowModule } from "./slideshow/slideshow.module";
import { UserModule } from "./user/user.module";

@Module({
    imports: [
        // Config must be first so other modules can use environment variables
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ["projects/backend/base/.env", ".env"]
        }),
        DatabaseModule,
        AdminLogsModule,
        AuthModule,
        GamificationModule,
        CreditModule,
        UserModule,
        AnimeModule,
        AnimeListModule,
        ForumModule,
        GroupModule,
        SlideshowModule,
        ShopModule,
        CalendarModule,
        DashboardModule,
        GalleryModule,
        NotificationsModule,
        PushModule.register(),
        MessagesModule,
        BlogModule,
        ChronikModule,
        MarketplaceModule,
        FeedModule,
        FriendsModule,
        CommunityBotModule,
        LexiconModule,
        LinkDatabaseModule,
        TcgModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
