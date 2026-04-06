import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { HashtagEntity } from "./entities/hashtag.entity";
import { HashtagUsageEntity } from "./entities/hashtag-usage.entity";
import { HashtagController } from "./hashtag.controller";
import { HashtagService } from "./hashtag.service";

@Module({
    imports: [TypeOrmModule.forFeature([HashtagEntity, HashtagUsageEntity])],
    controllers: [HashtagController],
    providers: [HashtagService],
    exports: [HashtagService]
})
export class HashtagModule {}
