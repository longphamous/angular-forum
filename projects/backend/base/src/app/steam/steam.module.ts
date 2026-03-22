import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { SteamProfileEntity } from "./entities/steam-profile.entity";
import { SteamController } from "./steam.controller";
import { SteamService } from "./steam.service";

@Module({
    imports: [TypeOrmModule.forFeature([SteamProfileEntity, UserEntity])],
    controllers: [SteamController],
    providers: [SteamService],
    exports: [SteamService]
})
export class SteamModule {}
