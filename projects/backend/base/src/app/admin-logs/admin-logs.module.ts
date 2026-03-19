import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AdminLogsController } from "./admin-logs.controller";
import { AdminLogsService } from "./admin-logs.service";
import { AdminLogEntity } from "./entities/admin-log.entity";

/**
 * @Global() makes AdminLogsService available throughout the entire
 * application without needing to import AdminLogsModule in every module.
 * Other services can inject AdminLogsService directly to log system events.
 */
@Global()
@Module({
    imports: [TypeOrmModule.forFeature([AdminLogEntity])],
    controllers: [AdminLogsController],
    providers: [AdminLogsService],
    exports: [AdminLogsService]
})
export class AdminLogsModule {}
