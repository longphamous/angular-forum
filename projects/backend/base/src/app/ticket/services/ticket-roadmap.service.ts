import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { TicketEntity } from "../entities/ticket.entity";
import type { RoadmapEpicDto } from "../models/ticket.model";

@Injectable()
export class TicketRoadmapService {
    constructor(@InjectRepository(TicketEntity) private readonly ticketRepo: Repository<TicketEntity>) {}

    async getRoadmap(projectId: string): Promise<RoadmapEpicDto[]> {
        // Get all epics for this project
        const epics = await this.ticketRepo.find({
            where: { projectId, type: "epic" },
            order: { dueDate: { direction: "ASC", nulls: "LAST" }, createdAt: "ASC" }
        });

        const result: RoadmapEpicDto[] = [];

        for (const epic of epics) {
            const children = await this.ticketRepo.find({
                where: { parentId: epic.id },
                select: ["id", "status"]
            });

            const completedStatuses = new Set(["resolved", "closed"]);
            const completedCount = children.filter((c) => completedStatuses.has(c.status)).length;
            const completionPercent = children.length > 0 ? Math.round((completedCount / children.length) * 100) : 0;

            result.push({
                id: epic.id,
                ticketNumber: epic.ticketNumber,
                title: epic.title,
                status: epic.status,
                priority: epic.priority,
                startDate: epic.createdAt.toISOString().split("T")[0],
                dueDate: epic.dueDate?.toISOString().split("T")[0],
                storyPoints: epic.storyPoints,
                childCount: children.length,
                completedChildCount: completedCount,
                completionPercent
            });
        }

        return result;
    }
}
