import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { LottoController } from "./lotto.controller";
import { LottoScheduler } from "./lotto.scheduler";
import { LottoService } from "./lotto.service";

@Module({
    imports: [ScheduleModule.forRoot()],
    controllers: [LottoController],
    providers: [LottoService, LottoScheduler],
    exports: [LottoService]
})
export class LottoModule {}
