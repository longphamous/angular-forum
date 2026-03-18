import { forwardRef, Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreditModule } from "../credit.module";
import { LottoConfigEntity } from "./entities/lotto-config.entity";
import { LottoDrawEntity } from "./entities/lotto-draw.entity";
import { LottoSpecialDrawEntity } from "./entities/lotto-special-draw.entity";
import { LottoStatsEntity } from "./entities/lotto-stats.entity";
import { LottoTicketEntity } from "./entities/lotto-ticket.entity";
import { LottoController } from "./lotto.controller";
import { LottoScheduler } from "./lotto.scheduler";
import { LottoService } from "./lotto.service";

@Module({
    imports: [
        ScheduleModule.forRoot(),
        forwardRef(() => CreditModule),
        TypeOrmModule.forFeature([LottoDrawEntity, LottoTicketEntity, LottoSpecialDrawEntity, LottoConfigEntity, LottoStatsEntity])
    ],
    controllers: [LottoController],
    providers: [LottoService, LottoScheduler],
    exports: [LottoService]
})
export class LottoModule {}
