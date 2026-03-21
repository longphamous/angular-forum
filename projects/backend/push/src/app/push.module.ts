import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { PushGateway } from "./push.gateway";
import { PushHealthController } from "./push-health.controller";
import { PushHttpController } from "./push-http.controller";
import { PushService } from "./push.service";

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: ["projects/backend/push/.env", "projects/backend/base/.env", ".env"]
        })
    ],
    controllers: [PushHealthController, PushHttpController],
    providers: [PushGateway, PushService],
    exports: [PushGateway, PushService]
})
export class PushAppModule {}
