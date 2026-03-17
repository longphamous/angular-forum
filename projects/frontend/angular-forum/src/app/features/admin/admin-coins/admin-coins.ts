import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CheckboxModule } from "primeng/checkbox";
import { DividerModule } from "primeng/divider";
import { InputNumberModule } from "primeng/inputnumber";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { ProgressSpinnerModule } from "primeng/progressspinner";
import { SkeletonModule } from "primeng/skeleton";
import { TableModule } from "primeng/table";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { WALLET_ROUTES } from "../../../core/api/wallet.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import {
    AdminWalletEntry,
    CoinEarnConfig,
    PaginatedTransactions,
    RecalculateReport,
    WalletTransaction
} from "../../../core/models/wallet/wallet";

interface UserOption {
    id: string;
    username: string;
    displayName: string;
}

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    selector: "app-admin-coins",
    imports: [
        ButtonModule,
        CheckboxModule,
        DividerModule,
        FormsModule,
        InputNumberModule,
        InputTextModule,
        MessageModule,
        ProgressSpinnerModule,
        SkeletonModule,
        TableModule,
        TabsModule,
        TagModule,
        TextareaModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [MessageService],
    templateUrl: "./admin-coins.html"
})
export class AdminCoins implements OnInit {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    private readonly messageService = inject(MessageService);

    protected readonly loadingConfig = signal(true);
    protected readonly savingConfig = signal(false);
    protected readonly config = signal<CoinEarnConfig | null>(null);

    protected readonly loadingWallets = signal(true);
    protected readonly wallets = signal<AdminWalletEntry[]>([]);
    protected readonly totalCoins = signal(0);

    protected readonly loadingTx = signal(true);
    protected readonly transactions = signal<WalletTransaction[]>([]);
    protected readonly txTotal = signal(0);
    protected readonly txPage = signal(1);

    protected readonly transferring = signal(false);
    protected readonly transferForm = signal<{
        userId: string;
        displayName: string;
        amount: number;
        type: "reward" | "penalty";
        description: string;
    }>({ userId: "", displayName: "", amount: 10, type: "reward", description: "" });

    protected readonly userQuery = signal("");
    protected readonly userOptions = signal<UserOption[]>([]);
    protected readonly loadingUsers = signal(false);

    protected readonly recalculating = signal(false);
    protected readonly recalcResult = signal<RecalculateReport | null>(null);

    private get base(): string {
        return this.apiConfig.baseUrl;
    }

    ngOnInit(): void {
        this.loadConfig();
        this.loadWallets();
        this.loadTransactions(1);
    }

    private loadConfig(): void {
        this.loadingConfig.set(true);
        this.http.get<CoinEarnConfig>(`${this.base}${WALLET_ROUTES.adminConfig()}`).subscribe({
            next: (c) => {
                this.config.set(c);
                this.loadingConfig.set(false);
            },
            error: () => this.loadingConfig.set(false)
        });
    }

    private loadWallets(): void {
        this.loadingWallets.set(true);
        this.http.get<AdminWalletEntry[]>(`${this.base}${WALLET_ROUTES.adminWallets(50)}`).subscribe({
            next: (w) => {
                this.wallets.set(w);
                this.totalCoins.set(w.reduce((s, e) => s + e.balance, 0));
                this.loadingWallets.set(false);
            },
            error: () => this.loadingWallets.set(false)
        });
    }

    protected loadTransactions(page: number): void {
        this.loadingTx.set(true);
        this.txPage.set(page);
        this.http.get<PaginatedTransactions>(`${this.base}${WALLET_ROUTES.adminTransactions(page, 20)}`).subscribe({
            next: (res) => {
                this.transactions.set(res.data);
                this.txTotal.set(res.total);
                this.loadingTx.set(false);
            },
            error: () => this.loadingTx.set(false)
        });
    }

    protected saveConfig(): void {
        const cfg = this.config();
        if (!cfg) return;
        this.savingConfig.set(true);
        this.http.put<CoinEarnConfig>(`${this.base}${WALLET_ROUTES.adminConfig()}`, cfg).subscribe({
            next: (updated) => {
                this.config.set(updated);
                this.savingConfig.set(false);
                this.messageService.add({ severity: "success", summary: "Einstellungen gespeichert", life: 3000 });
                this.loadConfig();
            },
            error: () => {
                this.savingConfig.set(false);
                this.messageService.add({ severity: "error", summary: "Fehler beim Speichern", life: 3000 });
            }
        });
    }

    protected searchUsers(query: string): void {
        this.userQuery.set(query);
        if (query.length < 2) {
            this.userOptions.set([]);
            return;
        }
        this.loadingUsers.set(true);
        this.http.get<UserOption[]>(`${this.base}/user/search?q=${encodeURIComponent(query)}&limit=10`).subscribe({
            next: (users) => {
                this.userOptions.set(users);
                this.loadingUsers.set(false);
            },
            error: () => this.loadingUsers.set(false)
        });
    }

    protected selectUser(user: UserOption): void {
        this.transferForm.update((f) => ({ ...f, userId: user.id, displayName: user.displayName || user.username }));
        this.userOptions.set([]);
        this.userQuery.set(user.displayName || user.username);
    }

    protected submitTransfer(): void {
        const form = this.transferForm();
        if (!form.userId || form.amount <= 0 || !form.description.trim()) return;
        this.transferring.set(true);
        this.http
            .post(`${this.base}${WALLET_ROUTES.adminTransfer()}`, {
                toUserId: form.userId,
                amount: form.amount,
                type: form.type,
                description: form.description
            })
            .subscribe({
                next: () => {
                    this.transferring.set(false);
                    this.messageService.add({
                        severity: "success",
                        summary: `${form.type === "reward" ? "Gutschrift" : "Abzug"} erfolgreich`,
                        detail: `${form.amount} Coins an ${form.displayName}`,
                        life: 3000
                    });
                    this.transferForm.set({ userId: "", displayName: "", amount: 10, type: "reward", description: "" });
                    this.userQuery.set("");
                    this.loadWallets();
                    this.loadTransactions(1);
                },
                error: (err: { error?: { message?: string } }) => {
                    this.transferring.set(false);
                    const msg = err?.error?.message ?? "Fehler";
                    this.messageService.add({ severity: "error", summary: msg, life: 3000 });
                }
            });
    }

    protected startRecalculate(): void {
        this.recalculating.set(true);
        this.recalcResult.set(null);
        this.http.post<RecalculateReport>(`${this.base}${WALLET_ROUTES.adminRecalculate()}`, {}).subscribe({
            next: (report) => {
                this.recalculating.set(false);
                this.recalcResult.set(report);
                this.messageService.add({ severity: "success", summary: "Neuberechnung abgeschlossen", life: 3000 });
                this.loadWallets();
            },
            error: () => {
                this.recalculating.set(false);
                this.messageService.add({ severity: "error", summary: "Neuberechnung fehlgeschlagen", life: 3000 });
            }
        });
    }

    protected formatCredits(n: number): string {
        return n.toLocaleString("de-DE") + " Coins";
    }

    protected txTypeSeverity(type: string): "success" | "warn" | "danger" | "info" | "secondary" {
        if (type === "reward" || type === "lotto_win" || type === "admin_transfer") return "success";
        if (type === "deposit") return "info";
        if (type === "withdrawal" || type === "purchase" || type === "lotto_ticket") return "warn";
        return "secondary";
    }

    protected setTransferType(type: "reward" | "penalty"): void {
        this.transferForm.update((f) => ({ ...f, type }));
    }

    protected setTransferAmount(amount: number): void {
        this.transferForm.update((f) => ({ ...f, amount }));
    }

    protected setTransferDescription(description: string): void {
        this.transferForm.update((f) => ({ ...f, description }));
    }
}
