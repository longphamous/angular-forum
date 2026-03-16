import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AnimeModule } from "./anime/anime.module";
import { AnimeListModule } from "./anime/anime-list.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { BlogModule } from "./blog/blog.module";
import { CalendarModule } from "./calendar/calendar.module";
import { FeedModule } from "./feed/feed.module";
import { CreditModule } from "./credit/credit.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { DatabaseModule } from "./database/database.module";
import { ForumModule } from "./forum/forum.module";
import { GalleryModule } from "./gallery/gallery.module";
import { GamificationModule } from "./gamification/gamification.module";
import { GroupModule } from "./group/group.module";
import { MarketplaceModule } from "./marketplace/marketplace.module";
import { MessagesModule } from "./messages/messages.module";
import { NotificationsModule } from "./notifications/notifications.module";
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
        MessagesModule,
        BlogModule,
        MarketplaceModule,
        FeedModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
