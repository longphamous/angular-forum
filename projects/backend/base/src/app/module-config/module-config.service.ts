import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { ModuleConfigEntity } from "./module-config.entity";

export interface ModuleConfigDto {
    key: string;
    label: string;
    parentKey: string | null;
    enabled: boolean;
    icon: string | null;
    sortOrder: number;
}

@Injectable()
export class ModuleConfigService {
    constructor(
        @InjectRepository(ModuleConfigEntity)
        private readonly repo: Repository<ModuleConfigEntity>
    ) {}

    async findAll(): Promise<ModuleConfigDto[]> {
        const entities = await this.repo.find({ order: { sortOrder: "ASC", key: "ASC" } });
        return entities.map((e) => ({
            key: e.key,
            label: e.label,
            parentKey: e.parentKey,
            enabled: e.enabled,
            icon: e.icon,
            sortOrder: e.sortOrder
        }));
    }

    async update(key: string, enabled: boolean): Promise<ModuleConfigDto> {
        await this.repo.update(key, { enabled });

        // If disabling a parent, disable all children too
        const entity = await this.repo.findOneByOrFail({ key });
        if (!enabled && !entity.parentKey) {
            await this.repo.update({ parentKey: key }, { enabled: false });
        }

        return {
            key: entity.key,
            label: entity.label,
            parentKey: entity.parentKey,
            enabled,
            icon: entity.icon,
            sortOrder: entity.sortOrder
        };
    }

    async bulkUpdate(updates: Array<{ key: string; enabled: boolean }>): Promise<ModuleConfigDto[]> {
        for (const u of updates) {
            await this.update(u.key, u.enabled);
        }
        return this.findAll();
    }
}
