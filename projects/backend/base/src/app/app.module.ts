import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AnimeModule } from "./anime/anime.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { CreditModule } from "./credit/credit.module";
import { DatabaseModule } from "./database/database.module";
import { ForumModule } from "./forum/forum.module";
import { GamificationModule } from "./gamification/gamification.module";
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
        ForumModule
    ],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
