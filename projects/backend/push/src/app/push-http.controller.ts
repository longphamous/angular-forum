import { Body, Controller, HttpCode, Logger, Post } from "@nestjs/common";

import { PushEventType } from "../contracts";

import { PushService } from "./push.service";

interface EmitRequest {
    target: "user" | "thread" | "conversation" | "broadcast";
    targetId?: string;
    event: PushEventType;
    payload: unknown;
}

@Controller("push")
export class PushHttpController {
    private readonly logger = new Logger(PushHttpController.name);

    constructor(private readonly pushService: PushService) {}

    @Post("emit")
    @HttpCode(202)
    emit(@Body() body: EmitRequest): { accepted: boolean } {
        this.logger.log(`← HTTP emit: ${body.event} → ${body.target}:${body.targetId ?? "all"}`);
        try {
            switch (body.target) {
                case "user":
                    if (body.targetId) this.pushService.sendToUser(body.targetId, body.event, body.payload);
                    break;
                case "thread":
                    if (body.targetId) this.pushService.sendToThread(body.targetId, body.event, body.payload);
                    break;
                case "conversation":
                    if (body.targetId) this.pushService.sendToConversation(body.targetId, body.event, body.payload);
                    break;
                case "broadcast":
                    this.pushService.broadcast(body.event, body.payload);
                    break;
            }
            return { accepted: true };
        } catch (err) {
            this.logger.error(`Emit failed: ${(err as Error).message}`);
            return { accepted: false };
        }
    }
}
