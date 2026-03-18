import { HttpClient } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnDestroy, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslocoModule } from "@jsverse/transloco";
import { MessageService } from "primeng/api";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { InputNumberModule } from "primeng/inputnumber";
import { MessageModule } from "primeng/message";
import { SkeletonModule } from "primeng/skeleton";
import { TabsModule } from "primeng/tabs";
import { TagModule } from "primeng/tag";
import { ToastModule } from "primeng/toast";
import { TooltipModule } from "primeng/tooltip";

import { LOTTO_ROUTES } from "../../../core/api/lotto.routes";
import { WALLET_ROUTES } from "../../../core/api/wallet.routes";
import { API_CONFIG, ApiConfig } from "../../../core/config/api.config";
import {
    DrawScheduleConfig,
    LottoDraw,
    LottoPrizeClass,
    LottoResult,
    LottoStats,
    LottoTicket,
    MyTicketWithResult,
    PRIZE_CLASS_INFO,
    PRIZE_CLASSES,
    SpecialDraw
} from "../../../core/models/lotto/lotto";
import { Wallet } from "../../../core/models/wallet/wallet";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { AdminQuicklink } from "../../../shared/components/admin-quicklink/admin-quicklink";

@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        AdminQuicklink,
        BadgeModule,
        ButtonModule,
        FormsModule,
        InputNumberModule,
        MessageModule,
        SkeletonModule,
        TabsModule,
        TagModule,
        ToastModule,
        TooltipModule,
        TranslocoModule
    ],
    providers: [MessageService],
    selector: "app-lotto-page",
    templateUrl: "./lotto-page.html"
})
export class LottoPage implements OnInit, OnDestroy {
    private readonly http = inject(HttpClient);
    private readonly apiConfig = inject<ApiConfig>(API_CONFIG);
    protected readonly authFacade = inject(AuthFacade);
    protected readonly messageService = inject(MessageService);

    // ─── State ────────────────────────────────────────────────────────────────
    protected readonly loading = signal(true);
    protected readonly stats = signal<LottoStats | null>(null);
    protected readonly draws = signal<LottoDraw[]>([]);
    protected readonly config = signal<DrawScheduleConfig | null>(null);
    protected readonly wallet = signal<Wallet | null>(null);
    protected readonly myTickets = signal<LottoTicket[]>([]);
    protected readonly myResults = signal<LottoResult[]>([]);
    protected readonly purchasing = signal(false);
    protected readonly specialDraws = signal<SpecialDraw[]>([]);
    protected readonly purchasingSpecial = signal<string | null>(null); // drawId being purchased

    // ─── Ticket form ──────────────────────────────────────────────────────────
    protected selectedNumbers = signal<number[]>([]);
    protected selectedSuperNumber = signal<number | null>(null);
    protected repeatWeeks = signal(1);

    // ─── Countdown ────────────────────────────────────────────────────────────
    protected readonly countdown = signal({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    private countdownInterval: ReturnType<typeof setInterval> | null = null;

    // ─── Constants ────────────────────────────────────────────────────────────
    protected readonly prizeClasses = PRIZE_CLASSES;
    protected readonly prizeClassInfo = PRIZE_CLASS_INFO;
    protected readonly numbers1to49 = Array.from({ length: 49 }, (_, i) => i + 1);
    protected readonly superNumbers = Array.from({ length: 10 }, (_, i) => i);

    // ─── Computed ─────────────────────────────────────────────────────────────
    protected readonly nextDraw = computed(() => this.stats()?.nextDraw ?? null);
    protected readonly lastDraw = computed(() => this.stats()?.lastDraw ?? null);

    protected readonly ticketCost = computed(() => (this.config()?.ticketCost ?? 2) * this.repeatWeeks());

    protected readonly canBuy = computed(
        () =>
            this.selectedNumbers().length === 6 &&
            this.selectedSuperNumber() !== null &&
            !this.purchasing() &&
            (this.wallet()?.balance ?? 0) >= this.ticketCost()
    );

    protected readonly myTicketsWithResults = computed((): MyTicketWithResult[] => {
        const ticketList = this.myTickets();
        const drawList = this.draws();
        const resultList = this.myResults();
        return ticketList
            .map((ticket) => {
                const draw = drawList.find((d) => d.id === ticket.drawId);
                const result = resultList.find((r) => r.ticketId === ticket.id);
                return { ticket, draw: draw!, result };
            })
            .filter((t) => t.draw);
    });

    protected readonly hotNumbersSet = computed(() => new Set(this.stats()?.hotNumbers ?? []));
    protected readonly coldNumbersSet = computed(() => new Set(this.stats()?.coldNumbers ?? []));

    protected readonly pendingDraws = computed(() => this.draws().filter((d) => d.status === "pending"));
    protected readonly completedDraws = computed(() =>
        this.draws()
            .filter((d) => d.status === "drawn")
            .sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime())
    );

    constructor() {
        effect(() => {
            const next = this.nextDraw();
            if (next) this.startCountdown(next.drawDate);
        });
    }

    ngOnInit(): void {
        this.loadAll();
    }

    ngOnDestroy(): void {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
    }

    private loadAll(): void {
        this.loading.set(true);
        const base = this.apiConfig.baseUrl;

        this.http.get<LottoStats>(`${base}${LOTTO_ROUTES.stats()}`).subscribe({
            next: (s) => this.stats.set(s)
        });

        this.http.get<LottoDraw[]>(`${base}${LOTTO_ROUTES.draws()}`).subscribe({
            next: (d) => this.draws.set(d)
        });

        this.http.get<DrawScheduleConfig>(`${base}${LOTTO_ROUTES.config()}`).subscribe({
            next: (c) => this.config.set(c)
        });

        this.http.get<Wallet>(`${base}${WALLET_ROUTES.wallet()}`).subscribe({
            next: (w) => this.wallet.set(w)
        });

        this.http.get<LottoTicket[]>(`${base}${LOTTO_ROUTES.myTickets()}`).subscribe({
            next: (t) => this.myTickets.set(t)
        });

        this.http.get<LottoResult[]>(`${base}${LOTTO_ROUTES.myResults()}`).subscribe({
            next: (r) => {
                this.myResults.set(r);
                this.loading.set(false);
            },
            error: () => this.loading.set(false)
        });

        this.http.get<SpecialDraw[]>(`${base}${LOTTO_ROUTES.specialDraws()}`).subscribe({
            next: (s) => this.specialDraws.set(s)
        });
    }

    // ─── Number selection ─────────────────────────────────────────────────────
    protected toggleNumber(n: number): void {
        const current = this.selectedNumbers();
        if (current.includes(n)) {
            this.selectedNumbers.set(current.filter((x) => x !== n));
        } else if (current.length < 6) {
            this.selectedNumbers.set([...current, n].sort((a, b) => a - b));
        }
    }

    protected selectSuperNumber(n: number): void {
        this.selectedSuperNumber.set(this.selectedSuperNumber() === n ? null : n);
    }

    protected quickPick(): void {
        const pool = Array.from({ length: 49 }, (_, i) => i + 1);
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        this.selectedNumbers.set(pool.slice(0, 6).sort((a, b) => a - b));
        this.selectedSuperNumber.set(Math.floor(Math.random() * 10));
    }

    protected clearSelection(): void {
        this.selectedNumbers.set([]);
        this.selectedSuperNumber.set(null);
    }

    // ─── Purchase ─────────────────────────────────────────────────────────────
    protected purchaseTicket(): void {
        const next = this.nextDraw();
        if (!next || !this.canBuy()) return;
        this.purchasing.set(true);

        const payload = {
            numbers: this.selectedNumbers(),
            superNumber: this.selectedSuperNumber()!,
            drawId: next.id,
            repeatWeeks: this.repeatWeeks()
        };

        this.http.post<LottoTicket[]>(`${this.apiConfig.baseUrl}${LOTTO_ROUTES.purchaseTicket()}`, payload).subscribe({
            next: (tickets) => {
                this.purchasing.set(false);
                this.myTickets.update((t) => [...t, ...tickets]);
                // Deduct from wallet display
                this.wallet.update((w) => (w ? { ...w, balance: w.balance - this.ticketCost() } : w));
                this.clearSelection();
                this.messageService.add({
                    severity: "success",
                    summary: `${tickets.length} Ticket${tickets.length > 1 ? "s" : ""} gekauft!`,
                    life: 3000
                });
            },
            error: (err) => {
                this.purchasing.set(false);
                const msg = err?.error?.message ?? "Fehler beim Kauf";
                this.messageService.add({ severity: "error", summary: msg, life: 3000 });
            }
        });
    }

    protected purchaseSpecialTicket(draw: SpecialDraw): void {
        if (!this.canBuy()) return;
        this.purchasingSpecial.set(draw.id);

        const payload = {
            numbers: this.selectedNumbers(),
            superNumber: this.selectedSuperNumber()!
        };

        this.http
            .post<LottoTicket>(`${this.apiConfig.baseUrl}${LOTTO_ROUTES.buySpecialTicket(draw.id)}`, payload)
            .subscribe({
                next: () => {
                    this.purchasingSpecial.set(null);
                    const cost = draw.ticketCost ?? this.config()?.ticketCost ?? 2;
                    this.wallet.update((w) => (w ? { ...w, balance: w.balance - cost } : w));
                    this.clearSelection();
                    this.messageService.add({
                        severity: "success",
                        summary: `Ticket für Sonderziehung "${draw.name}" gekauft!`,
                        life: 3000
                    });
                },
                error: (err) => {
                    this.purchasingSpecial.set(null);
                    const msg = err?.error?.message ?? "Fehler beim Kauf";
                    this.messageService.add({ severity: "error", summary: msg, life: 3000 });
                }
            });
    }

    protected pendingSpecialDraws(): SpecialDraw[] {
        return this.specialDraws().filter((d) => d.status === "pending");
    }

    // ─── Countdown ────────────────────────────────────────────────────────────
    private startCountdown(drawDate: string): void {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        const update = (): void => {
            const diff = new Date(drawDate).getTime() - Date.now();
            if (diff <= 0) {
                this.countdown.set({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }
            const days = Math.floor(diff / 86_400_000);
            const hours = Math.floor((diff % 86_400_000) / 3_600_000);
            const minutes = Math.floor((diff % 3_600_000) / 60_000);
            const seconds = Math.floor((diff % 60_000) / 1000);
            this.countdown.set({ days, hours, minutes, seconds });
        };
        update();
        this.countdownInterval = setInterval(update, 1000);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────
    protected formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString("de-DE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    protected formatCredits(n: number): string {
        return n.toLocaleString("de-DE") + " Coins";
    }

    protected prizeClassSeverity(pc: LottoPrizeClass): "success" | "warn" | "danger" | "info" | "secondary" {
        if (pc === "class1" || pc === "class2") return "success";
        if (pc === "class3" || pc === "class4") return "warn";
        if (pc === "no_win") return "danger";
        return "info";
    }

    protected isNumberHot(n: number): boolean {
        return this.hotNumbersSet().has(n);
    }

    protected isNumberCold(n: number): boolean {
        return this.coldNumbersSet().has(n);
    }

    protected pad2(n: number): string {
        return n.toString().padStart(2, "0");
    }
}
