import { Module } from "@nestjs/common";

import { CreditController } from "./credit.controller";
import { CreditService } from "./credit.service";
import { LottoModule } from "./lotto/lotto.module";

@Module({
    imports: [LottoModule],
    controllers: [CreditController],
    providers: [CreditService],
    exports: [CreditService]
})
export class CreditModule {}
