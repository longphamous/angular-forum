import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ModuleConfigController } from "./module-config.controller";
import { ModuleConfigEntity } from "./module-config.entity";
import { ModuleConfigService } from "./module-config.service";

@Module({
    imports: [TypeOrmModule.forFeature([ModuleConfigEntity])],
    controllers: [ModuleConfigController],
    providers: [ModuleConfigService],
    exports: [ModuleConfigService]
})
export class ModuleConfigModule {}
