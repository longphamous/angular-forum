import { DynamicModule, Global, Logger, Module } from "@nestjs/common";

import { PushGateway } from "./push.gateway";
import { PushHealthController } from "./push-health.controller";
import { PushService } from "./push.service";
import { PushServiceNoop } from "./push.service.noop";
import { PushServiceRemote } from "./push.service.remote";

/**
 * Global push module providing real-time WebSocket events.
 *
 * Modes (controlled by `PUSH_MODE` env var):
 * - `embedded` (default): Runs WebSocket gateway in-process alongside the API.
 * - `remote`: Forwards events via HTTP to a standalone push server (set `PUSH_SERVER_URL`).
 * - `disabled`: No-op service — all push calls are silently dropped.
 *
 * Legacy: `PUSH_ENABLED=false` maps to `disabled` mode for backwards compatibility.
 */
@Global()
@Module({})
export class PushModule {
    private static readonly logger = new Logger(PushModule.name);

    static register(): DynamicModule {
        const mode = this.resolveMode();

        switch (mode) {
            case "embedded":
                this.logger.log("Push mode: EMBEDDED — WebSocket gateway runs in-process");
                return {
                    module: PushModule,
                    controllers: [PushHealthController],
                    providers: [PushGateway, PushService],
                    exports: [PushService]
                };

            case "remote":
                this.logger.log(
                    `Push mode: REMOTE — forwarding to ${process.env["PUSH_SERVER_URL"] ?? "http://localhost:3001/api/push"}`
                );
                return {
                    module: PushModule,
                    providers: [{ provide: PushService, useClass: PushServiceRemote }],
                    exports: [PushService]
                };

            case "disabled":
                this.logger.log("Push mode: DISABLED — using no-op service");
                return {
                    module: PushModule,
                    providers: [{ provide: PushService, useClass: PushServiceNoop }],
                    exports: [PushService]
                };
        }
    }

    private static resolveMode(): "embedded" | "remote" | "disabled" {
        const pushMode = process.env["PUSH_MODE"];
        if (pushMode === "remote") return "remote";
        if (pushMode === "disabled") return "disabled";
        if (process.env["PUSH_ENABLED"] === "false") return "disabled";
        return "embedded";
    }
}
