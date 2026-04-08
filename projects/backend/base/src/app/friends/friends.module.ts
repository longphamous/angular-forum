import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RpgModule } from "../rpg/rpg.module";
import { UserEntity } from "../user/entities/user.entity";
import { FriendshipEntity } from "./entities/friendship.entity";
import { FriendsController } from "./friends.controller";
import { FriendsService } from "./friends.service";

@Module({
    imports: [RpgModule, TypeOrmModule.forFeature([FriendshipEntity, UserEntity])],
    controllers: [FriendsController],
    providers: [FriendsService],
    exports: [FriendsService]
})
export class FriendsModule {}
