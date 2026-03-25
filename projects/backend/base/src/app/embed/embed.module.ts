import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EmbedController } from "./embed.controller";
import { EmbedService } from "./embed.service";
import { LinkEmbedEntity } from "./entities/link-embed.entity";

@Module({
    imports: [TypeOrmModule.forFeature([LinkEmbedEntity])],
    controllers: [EmbedController],
    providers: [EmbedService],
    exports: [EmbedService]
})
export class EmbedModule {}
