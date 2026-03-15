import { forwardRef, Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";

import { CreditModule } from "../credit.module";
import { LottoController } from "./lotto.controller";
import { LottoScheduler } from "./lotto.scheduler";
import { LottoService } from "./lotto.service";

@Module({
    imports: [ScheduleModule.forRoot(), forwardRef(() => CreditModule)],
    controllers: [LottoController],
    providers: [LottoService, LottoScheduler],
    exports: [LottoService]
})
export class LottoModule {}
