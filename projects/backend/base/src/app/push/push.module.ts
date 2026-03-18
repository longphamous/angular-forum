import { DynamicModule, Global, Logger, Module } from "@nestjs/common";

import { PushGateway } from "./push.gateway";
import { PushService } from "./push.service";
import { PushServiceNoop } from "./push.service.noop";

/**
 * Global push module providing real-time WebSocket events.
 *
 * Controlled by `PUSH_ENABLED` env var (defaults to `true`).
 * When disabled, a no-op PushService is provided so that
 * all injectors still work — they just silently drop events.
 */
@Global()
@Module({})
export class PushModule {
    private static readonly logger = new Logger(PushModule.name);

    static register(): DynamicModule {
        const enabled = process.env["PUSH_ENABLED"] !== "false";

        if (enabled) {
            this.logger.log("Push module ENABLED — WebSocket gateway will be started");
            return {
                module: PushModule,
                providers: [PushGateway, PushService],
                exports: [PushService]
            };
        }

        this.logger.log("Push module DISABLED — using no-op service");
        return {
            module: PushModule,
            providers: [{ provide: PushService, useClass: PushServiceNoop }],
            exports: [PushService]
        };
    }
}
