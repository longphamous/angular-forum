import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { NotificationEntity } from "./entities/notification.entity";
import { NotificationsController } from "./notifications.controller";
import { NotificationsService } from "./notifications.service";

/**
 * @Global() makes NotificationsService available throughout the entire
 * application without needing to import NotificationsModule in every module.
 * Other services (MessagesService, GamificationService, CreditService, …)
 * can inject NotificationsService directly after registering this module once
 * in AppModule.
 */
@Global()
@Module({
    imports: [TypeOrmModule.forFeature([NotificationEntity])],
    controllers: [NotificationsController],
    providers: [NotificationsService],
    exports: [NotificationsService]
})
export class NotificationsModule {}
