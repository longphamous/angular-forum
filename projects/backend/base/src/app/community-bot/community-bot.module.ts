import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";

import { NotificationsModule } from "../notifications/notifications.module";
import { UserEntity } from "../user/entities/user.entity";
import { BotSchedulerService } from "./bot-scheduler.service";
import { CommunityBotController } from "./community-bot.controller";
import { CommunityBotService } from "./community-bot.service";
import { BotLogEntity } from "./entities/bot-log.entity";
import { BotNotificationQueueEntity } from "./entities/bot-notification-queue.entity";
import { CommunityBotEntity } from "./entities/community-bot.entity";

@Module({
    imports: [
        ScheduleModule.forRoot(),
        TypeOrmModule.forFeature([CommunityBotEntity, BotLogEntity, BotNotificationQueueEntity, UserEntity]),
        NotificationsModule
    ],
    controllers: [CommunityBotController],
    providers: [CommunityBotService, BotSchedulerService],
    exports: [CommunityBotService]
})
export class CommunityBotModule {}
