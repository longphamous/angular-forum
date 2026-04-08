import { Body, Controller, Get, Param, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { Public, Roles } from "../auth/auth.decorators";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ModuleConfigDto, ModuleConfigService } from "./module-config.service";

@ApiTags("Module Config")
@ApiBearerAuth("JWT")
@Controller("module-config")
export class ModuleConfigController {
    constructor(private readonly service: ModuleConfigService) {}

    @Public()
    @Get()
    findAll(): Promise<ModuleConfigDto[]> {
        return this.service.findAll();
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Patch(":key")
    update(
        @Param("key") key: string,
        @Body() body: { enabled: boolean }
    ): Promise<ModuleConfigDto> {
        return this.service.update(key, body.enabled);
    }

    @UseGuards(RolesGuard)
    @Roles("admin")
    @Patch()
    bulkUpdate(@Body() body: Array<{ key: string; enabled: boolean }>): Promise<ModuleConfigDto[]> {
        return this.service.bulkUpdate(body);
    }
}
