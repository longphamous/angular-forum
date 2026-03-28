import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { TicketAdminController } from "./controllers/ticket-admin.controller";
import { TicketBoardController } from "./controllers/ticket-board.controller";
import { TicketController } from "./controllers/ticket.controller";
import { TicketActivityLogEntity } from "./entities/ticket-activity-log.entity";
import { TicketCategoryEntity } from "./entities/ticket-category.entity";
import { TicketCommentEntity } from "./entities/ticket-comment.entity";
import { TicketLabelEntity } from "./entities/ticket-label.entity";
import { TicketLinkEntity } from "./entities/ticket-link.entity";
import { TicketProjectEntity } from "./entities/ticket-project.entity";
import { TicketWorkflowStatusEntity } from "./entities/ticket-workflow-status.entity";
import { TicketWorkflowTransitionEntity } from "./entities/ticket-workflow-transition.entity";
import { TicketWorkflowEntity } from "./entities/ticket-workflow.entity";
import { TicketEntity } from "./entities/ticket.entity";
import { TicketActivityService } from "./services/ticket-activity.service";
import { TicketAdminService } from "./services/ticket-admin.service";
import { TicketWorkflowService } from "./services/ticket-workflow.service";
import { TicketService } from "./services/ticket.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            TicketEntity,
            TicketCommentEntity,
            TicketCategoryEntity,
            TicketProjectEntity,
            TicketLabelEntity,
            TicketLinkEntity,
            TicketActivityLogEntity,
            TicketWorkflowEntity,
            TicketWorkflowStatusEntity,
            TicketWorkflowTransitionEntity,
            UserEntity
        ])
    ],
    controllers: [TicketController, TicketAdminController, TicketBoardController],
    providers: [TicketService, TicketAdminService, TicketActivityService, TicketWorkflowService],
    exports: [TicketService]
})
export class TicketModule {}
