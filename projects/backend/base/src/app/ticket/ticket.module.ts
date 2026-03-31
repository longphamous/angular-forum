import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { TicketController, TicketDetailController } from "./controllers/ticket.controller";
import { TicketAdminController } from "./controllers/ticket-admin.controller";
import { TicketBoardController } from "./controllers/ticket-board.controller";
import { TicketReportingController } from "./controllers/ticket-reporting.controller";
import { TicketRoadmapController } from "./controllers/ticket-roadmap.controller";
import { TicketSprintController } from "./controllers/ticket-sprint.controller";
import { TicketEntity } from "./entities/ticket.entity";
import { TicketActivityLogEntity } from "./entities/ticket-activity-log.entity";
import { TicketAttachmentEntity } from "./entities/ticket-attachment.entity";
import { TicketAutomationRuleEntity } from "./entities/ticket-automation-rule.entity";
import { TicketCategoryEntity } from "./entities/ticket-category.entity";
import { TicketCommentEntity } from "./entities/ticket-comment.entity";
import { TicketCustomFieldDefEntity } from "./entities/ticket-custom-field-def.entity";
import { TicketLabelEntity } from "./entities/ticket-label.entity";
import { TicketLinkEntity } from "./entities/ticket-link.entity";
import { TicketProjectEntity } from "./entities/ticket-project.entity";
import { TicketProjectMemberEntity } from "./entities/ticket-project-member.entity";
import { TicketSlaConfigEntity } from "./entities/ticket-sla-config.entity";
import { TicketSprintEntity } from "./entities/ticket-sprint.entity";
import { TicketWatcherEntity } from "./entities/ticket-watcher.entity";
import { TicketWorkLogEntity } from "./entities/ticket-work-log.entity";
import { TicketWorkflowEntity } from "./entities/ticket-workflow.entity";
import { TicketWorkflowStatusEntity } from "./entities/ticket-workflow-status.entity";
import { TicketWorkflowTransitionEntity } from "./entities/ticket-workflow-transition.entity";
import { TicketService } from "./services/ticket.service";
import { TicketActivityService } from "./services/ticket-activity.service";
import { TicketAdminService } from "./services/ticket-admin.service";
import { TicketAttachmentService } from "./services/ticket-attachment.service";
import { TicketAutomationService } from "./services/ticket-automation.service";
import { TicketCustomFieldService } from "./services/ticket-custom-field.service";
import { TicketProjectMemberService } from "./services/ticket-project-member.service";
import { TicketReportingService } from "./services/ticket-reporting.service";
import { TicketRoadmapService } from "./services/ticket-roadmap.service";
import { TicketSlaService } from "./services/ticket-sla.service";
import { TicketSprintService } from "./services/ticket-sprint.service";
import { TicketWatcherService } from "./services/ticket-watcher.service";
import { TicketWorkLogService } from "./services/ticket-work-log.service";
import { TicketWorkflowService } from "./services/ticket-workflow.service";

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
            TicketSprintEntity,
            TicketSlaConfigEntity,
            TicketWatcherEntity,
            TicketAttachmentEntity,
            TicketWorkLogEntity,
            TicketProjectMemberEntity,
            TicketAutomationRuleEntity,
            TicketCustomFieldDefEntity,
            UserEntity
        ])
    ],
    controllers: [
        TicketController,
        TicketAdminController,
        TicketBoardController,
        TicketSprintController,
        TicketReportingController,
        TicketRoadmapController,
        TicketDetailController
    ],
    providers: [
        TicketService,
        TicketAdminService,
        TicketActivityService,
        TicketWorkflowService,
        TicketSprintService,
        TicketReportingService,
        TicketSlaService,
        TicketWatcherService,
        TicketAttachmentService,
        TicketWorkLogService,
        TicketProjectMemberService,
        TicketAutomationService,
        TicketCustomFieldService,
        TicketRoadmapService
    ],
    exports: [TicketService]
})
export class TicketModule {}
