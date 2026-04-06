import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { PushService } from "./push.service";

@ApiTags("System")
@Controller("push")
export class PushHealthController {
    constructor(private readonly pushService: PushService) {}

    @Get("health")
    health(): { status: string; onlineUsers: number; uptime: number; timestamp: string } {
        return {
            status: "ok",
            onlineUsers: this.pushService.getOnlineCount(),
            uptime: process.uptime(),
            timestamp: new Date().toISOString()
        };
    }

    @Get("online")
    online(): { userIds: string[]; count: number } {
        const userIds = this.pushService.getOnlineUserIds();
        return { userIds, count: userIds.length };
    }
}
