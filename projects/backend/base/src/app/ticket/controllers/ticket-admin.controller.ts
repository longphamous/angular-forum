import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";

import { Roles } from "../../auth/auth.decorators";
import { CurrentUser } from "../../auth/current-user.decorator";
import { AuthenticatedUser } from "../../auth/models/jwt.model";
import { CreateAutomationRuleDto } from "../dto/create-automation-rule.dto";
import { CreateCategoryDto } from "../dto/create-category.dto";
import { CreateCustomFieldDefDto } from "../dto/create-custom-field-def.dto";
import { CreateLabelDto } from "../dto/create-label.dto";
import { CreateProjectDto } from "../dto/create-project.dto";
import { CreateWorkflowDto } from "../dto/create-workflow.dto";
import { ManageProjectMemberDto } from "../dto/manage-project-member.dto";
import { UpdateProjectDto } from "../dto/update-project.dto";
import { UpdateWorkflowDto } from "../dto/update-workflow.dto";
import type { AutomationRuleDto, CustomFieldDefDto, LabelDto, ProjectMemberDto, TicketCategoryDto, TicketProjectDto, WorkflowDto } from "../models/ticket.model";
import { TicketAdminService } from "../services/ticket-admin.service";
import { TicketAutomationService } from "../services/ticket-automation.service";
import { TicketCustomFieldService } from "../services/ticket-custom-field.service";
import { TicketProjectMemberService } from "../services/ticket-project-member.service";
import { TicketWorkflowService } from "../services/ticket-workflow.service";

@Roles("admin")
@Controller("tickets/admin")
export class TicketAdminController {
    constructor(
        private readonly adminService: TicketAdminService,
        private readonly workflowService: TicketWorkflowService,
        private readonly memberService: TicketProjectMemberService,
        private readonly automationService: TicketAutomationService,
        private readonly customFieldService: TicketCustomFieldService
    ) {}

    // ── Projects ───────────────────────────────────────────────────────────────

    @Get("projects")
    getProjects(): Promise<TicketProjectDto[]> {
        return this.adminService.getProjects();
    }

    @Post("projects")
    createProject(@Body() dto: CreateProjectDto, @CurrentUser() user: AuthenticatedUser): Promise<TicketProjectDto> {
        return this.adminService.createProject(user.userId, dto);
    }

    @Patch("projects/:id")
    updateProject(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateProjectDto): Promise<TicketProjectDto> {
        return this.adminService.updateProject(id, dto);
    }

    @Delete("projects/:id")
    async deleteProject(@Param("id", ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
        await this.adminService.deleteProject(id);
        return { success: true };
    }

    // ── Workflows ────────────────────────────────────────────────────────────

    @Get("workflows")
    getWorkflows(@Query("projectId") projectId?: string): Promise<WorkflowDto[]> {
        return this.workflowService.getWorkflows(projectId);
    }

    @Get("workflows/:id")
    getWorkflow(@Param("id", ParseUUIDPipe) id: string): Promise<WorkflowDto> {
        return this.workflowService.getWorkflow(id);
    }

    @Post("workflows")
    createWorkflow(@Body() dto: CreateWorkflowDto): Promise<WorkflowDto> {
        return this.workflowService.createWorkflow(dto);
    }

    @Post("workflows/seed-default")
    seedDefaultWorkflow(@Query("projectId") projectId?: string): Promise<WorkflowDto> {
        return this.workflowService.seedDefaultWorkflow(projectId);
    }

    @Patch("workflows/:id")
    updateWorkflow(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateWorkflowDto): Promise<WorkflowDto> {
        return this.workflowService.updateWorkflow(id, dto);
    }

    @Delete("workflows/:id")
    async deleteWorkflow(@Param("id", ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
        await this.workflowService.deleteWorkflow(id);
        return { success: true };
    }

    // ── Categories ─────────────────────────────────────────────────────────────

    @Get("categories")
    getCategories(): Promise<TicketCategoryDto[]> {
        return this.adminService.getCategories();
    }

    @Post("categories")
    createCategory(@Body() dto: CreateCategoryDto): Promise<TicketCategoryDto> {
        return this.adminService.createCategory(dto);
    }

    @Patch("categories/:id")
    updateCategory(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CreateCategoryDto): Promise<TicketCategoryDto> {
        return this.adminService.updateCategory(id, dto);
    }

    @Delete("categories/:id")
    async deleteCategory(@Param("id", ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
        await this.adminService.deleteCategory(id);
        return { success: true };
    }

    // ── Labels ─────────────────────────────────────────────────────────────────

    @Get("labels")
    getLabels(): Promise<LabelDto[]> {
        return this.adminService.getLabels();
    }

    @Post("labels")
    createLabel(@Body() dto: CreateLabelDto): Promise<LabelDto> {
        return this.adminService.createLabel(dto);
    }

    @Patch("labels/:id")
    updateLabel(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CreateLabelDto): Promise<LabelDto> {
        return this.adminService.updateLabel(id, dto);
    }

    @Delete("labels/:id")
    async deleteLabel(@Param("id", ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
        await this.adminService.deleteLabel(id);
        return { success: true };
    }

    // ── Project Members ──────────────────────────────────────────────────────

    @Get("projects/:id/members")
    getMembers(@Param("id", ParseUUIDPipe) id: string): Promise<ProjectMemberDto[]> {
        return this.memberService.getMembers(id);
    }

    @Post("projects/:id/members")
    addMember(@Param("id", ParseUUIDPipe) id: string, @Body() dto: ManageProjectMemberDto): Promise<ProjectMemberDto> {
        return this.memberService.addMember(id, dto);
    }

    @Delete("projects/:id/members/:memberId")
    async removeMember(@Param("memberId", ParseUUIDPipe) memberId: string): Promise<{ success: boolean }> {
        await this.memberService.removeMember(memberId);
        return { success: true };
    }

    // ── Automation Rules ─────────────────────────────────────────────────────

    @Get("projects/:id/automations")
    getRules(@Param("id", ParseUUIDPipe) id: string): Promise<AutomationRuleDto[]> {
        return this.automationService.getRules(id);
    }

    @Post("projects/:id/automations")
    createRule(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CreateAutomationRuleDto): Promise<AutomationRuleDto> {
        dto.projectId = id;
        return this.automationService.createRule(dto);
    }

    @Patch("automations/:id")
    updateRule(@Param("id", ParseUUIDPipe) id: string, @Body() dto: Partial<CreateAutomationRuleDto>): Promise<AutomationRuleDto> {
        return this.automationService.updateRule(id, dto);
    }

    @Post("automations/:id/toggle")
    toggleRule(@Param("id", ParseUUIDPipe) id: string): Promise<AutomationRuleDto> {
        return this.automationService.toggleRule(id);
    }

    @Delete("automations/:id")
    async deleteRule(@Param("id", ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
        await this.automationService.deleteRule(id);
        return { success: true };
    }

    // ── Custom Fields ────────────────────────────────────────────────────────

    @Get("projects/:id/fields")
    getFields(@Param("id", ParseUUIDPipe) id: string): Promise<CustomFieldDefDto[]> {
        return this.customFieldService.getFields(id);
    }

    @Post("projects/:id/fields")
    createField(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CreateCustomFieldDefDto): Promise<CustomFieldDefDto> {
        dto.projectId = id;
        return this.customFieldService.createField(dto);
    }

    @Patch("fields/:id")
    updateField(@Param("id", ParseUUIDPipe) id: string, @Body() dto: Partial<CreateCustomFieldDefDto>): Promise<CustomFieldDefDto> {
        return this.customFieldService.updateField(id, dto);
    }

    @Delete("fields/:id")
    async deleteField(@Param("id", ParseUUIDPipe) id: string): Promise<{ success: boolean }> {
        await this.customFieldService.deleteField(id);
        return { success: true };
    }
}
