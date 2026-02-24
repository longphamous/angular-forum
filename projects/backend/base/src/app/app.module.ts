import { Module } from "@nestjs/common";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { GamificationModule } from "./gamification/gamification.module";

@Module({
    imports: [GamificationModule],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
