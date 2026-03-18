import { HttpClient } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable, tap } from "rxjs";

import { WALLET_ROUTES } from "../../core/api/wallet.routes";
import { API_CONFIG, ApiConfig } from "../../core/config/api.config";
import { PaginatedTransactions, Wallet, WalletTransaction } from "../../core/models/wallet/wallet";

@Injectable({ providedIn: "root" })
export class WalletFacade {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);

    readonly wallet = signal<Wallet | null>(null);
    readonly walletLoading = signal(false);
    readonly transactions = signal<WalletTransaction[]>([]);
    readonly transactionsTotal = signal(0);
    readonly transactionsLoading = signal(false);
    readonly transferring = signal(false);

    private get base(): string {
        return this.apiConfig.baseUrl;
    }

    loadWallet(): void {
        this.walletLoading.set(true);
        this.http.get<Wallet>(`${this.base}${WALLET_ROUTES.wallet()}`).subscribe({
            next: (w) => {
                this.wallet.set(w);
                this.walletLoading.set(false);
            },
            error: () => this.walletLoading.set(false)
        });
    }

    loadTransactions(page = 1, limit = 20): void {
        this.transactionsLoading.set(true);
        this.http.get<PaginatedTransactions>(`${this.base}${WALLET_ROUTES.transactions(page, limit)}`).subscribe({
            next: (res) => {
                this.transactions.set(res.data);
                this.transactionsTotal.set(res.total);
                this.transactionsLoading.set(false);
            },
            error: () => this.transactionsLoading.set(false)
        });
    }

    transfer(toUserId: string, amount: number, description?: string): Observable<WalletTransaction> {
        this.transferring.set(true);
        return this.http
            .post<WalletTransaction>(`${this.base}${WALLET_ROUTES.transfer()}`, { toUserId, amount, description })
            .pipe(
                tap({
                    next: () => {
                        this.transferring.set(false);
                        this.loadWallet();
                        this.loadTransactions();
                    },
                    error: () => this.transferring.set(false)
                })
            );
    }
}
