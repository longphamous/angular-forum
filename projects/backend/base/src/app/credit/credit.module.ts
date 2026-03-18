import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CreditController } from "./credit.controller";
import { CreditService } from "./credit.service";
import { UserWalletEntity } from "./entities/user-wallet.entity";
import { WalletTransactionEntity } from "./entities/wallet-transaction.entity";
import { LottoModule } from "./lotto/lotto.module";

@Module({
    imports: [TypeOrmModule.forFeature([UserWalletEntity, WalletTransactionEntity]), forwardRef(() => LottoModule)],
    controllers: [CreditController],
    providers: [CreditService],
    exports: [CreditService]
})
export class CreditModule {}
