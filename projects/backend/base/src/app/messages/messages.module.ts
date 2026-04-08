import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RpgModule } from "../rpg/rpg.module";
import { UserEntity } from "../user/entities/user.entity";
import { ConversationEntity } from "./entities/conversation.entity";
import { MessageEntity } from "./entities/message.entity";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";

@Module({
    imports: [RpgModule, TypeOrmModule.forFeature([ConversationEntity, MessageEntity, UserEntity])],
    controllers: [MessagesController],
    providers: [MessagesService],
    exports: [MessagesService]
})
export class MessagesModule {}
