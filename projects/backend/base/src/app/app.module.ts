import { Module } from "@nestjs/common";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { CreditModule } from "./credit/credit.module";
import { GamificationModule } from "./gamification/gamification.module";

@Module({
    imports: [GamificationModule, CreditModule],
    controllers: [AppController],
    providers: [AppService]
})
export class AppModule {}
