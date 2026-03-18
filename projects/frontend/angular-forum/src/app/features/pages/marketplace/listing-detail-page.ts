import { CurrencyPipe } from "@angular/common";
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { TranslocoModule } from "@jsverse/transloco";
import { AvatarModule } from "primeng/avatar";
import { ButtonModule } from "primeng/button";
import { DialogModule } from "primeng/dialog";
import { DividerModule } from "primeng/divider";
import { InputNumberModule } from "primeng/inputnumber";
import { MessageModule } from "primeng/message";
import { RatingModule } from "primeng/rating";
import { SkeletonModule } from "primeng/skeleton";
import { TagModule } from "primeng/tag";
import { TextareaModule } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";

import { MarketOffer } from "../../../core/models/marketplace/marketplace";
import { NavigationHistoryService } from "../../../core/services/navigation-history.service";
import { AuthFacade } from "../../../facade/auth/auth-facade";
import { MarketplaceFacade } from "../../../facade/marketplace/marketplace-facade";

@Component({
    selector: "listing-detail-page",
    standalone: true,
    imports: [
        RouterModule,
        FormsModule,
        TranslocoModule,
        ButtonModule,
        TagModule,
        SkeletonModule,
        RatingModule,
        TextareaModule,
        InputNumberModule,
        DividerModule,
        DialogModule,
        MessageModule,
        AvatarModule,
        TooltipModule,
        CurrencyPipe
    ],
    templateUrl: "./listing-detail-page.html",
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListingDetailPage implements OnInit {
    readonly facade = inject(MarketplaceFacade);
    readonly navHistory = inject(NavigationHistoryService);
    private readonly authFacade = inject(AuthFacade);
    private readonly route = inject(ActivatedRoute);
    private readonly cd = inject(ChangeDetectorRef);

    // Offer dialog
    offerVisible = signal(false);
    offerAmount: number | null = null;
    offerMessage = "";
    submittingOffer = false;
    offerError: string | null = null;

    // Counter-offer dialog
    counterVisible = signal(false);
    selectedOffer: MarketOffer | null = null;
    counterAmount: number | null = null;
    counterMessage = "";

    // Report dialog
    reportVisible = signal(false);
    reportReason = "";
    reportSuccess = signal(false);

    // Comment
    newComment = "";
    replyToId: string | null = null;
    submittingComment = false;

    // Rating dialog
    ratingVisible = signal(false);
    ratingScore = 5;
    ratingText = "";
    ratingOfferId = "";
    ratingTargetUserId = "";

    private listingId = "";

    ngOnInit(): void {
        this.route.params.subscribe((params) => {
            this.listingId = params["id"] as string;
            this.facade.loadListing(this.listingId);
            this.facade.loadComments(this.listingId);
            this.facade.loadOffers(this.listingId);
            this.facade.loadRatings(this.listingId);
        });
    }

    get currentUserId(): string | undefined {
        return this.authFacade.currentUser()?.id;
    }

    get isOwner(): boolean {
        return this.currentUserId === this.facade.currentListing()?.authorId;
    }

    formatPrice(price: number | null, currency: string): string {
        if (price === null) return "Verhandelbar";
        return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(price);
    }

    formatDate(d: string): string {
        return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    typeLabel(t: string): string {
        return (
            ({ sell: "Verkaufen", buy: "Kaufen", trade: "Tauschen", gift: "Verschenken" } as Record<string, string>)[
                t
            ] ?? t
        );
    }

    typeSeverity(t: string): "success" | "info" | "warn" | "secondary" {
        return (
            (
                { sell: "success", buy: "info", trade: "warn", gift: "secondary" } as Record<
                    string,
                    "success" | "info" | "warn" | "secondary"
                >
            )[t] ?? "secondary"
        );
    }

    statusLabel(s: string): string {
        return (
            (
                {
                    active: "Aktiv",
                    pending: "Ausstehend",
                    sold: "Verkauft",
                    closed: "Geschlossen",
                    expired: "Abgelaufen",
                    archived: "Archiviert",
                    draft: "Entwurf"
                } as Record<string, string>
            )[s] ?? s
        );
    }

    statusSeverity(s: string): "success" | "warn" | "danger" | "secondary" {
        if (s === "active") return "success";
        if (s === "pending") return "warn";
        if (s === "sold") return "danger";
        return "secondary";
    }

    submitOffer(): void {
        if (!this.offerMessage.trim()) return;
        this.submittingOffer = true;
        this.offerError = null;
        this.facade.sendOffer(this.listingId, { amount: this.offerAmount, message: this.offerMessage }).subscribe({
            next: () => {
                this.offerVisible.set(false);
                this.offerMessage = "";
                this.offerAmount = null;
                this.submittingOffer = false;
                this.facade.loadOffers(this.listingId);
                this.cd.markForCheck();
            },
            error: () => {
                this.offerError = "Fehler beim Senden des Angebots.";
                this.submittingOffer = false;
                this.cd.markForCheck();
            }
        });
    }

    acceptOffer(offer: MarketOffer): void {
        this.facade.acceptOffer(this.listingId, offer.id).subscribe({
            next: () => {
                this.facade.loadListing(this.listingId);
                this.facade.loadOffers(this.listingId);
                this.cd.markForCheck();
            }
        });
    }

    rejectOffer(offer: MarketOffer): void {
        this.facade.rejectOffer(this.listingId, offer.id).subscribe({
            next: () => {
                this.facade.loadOffers(this.listingId);
                this.cd.markForCheck();
            }
        });
    }

    openCounter(offer: MarketOffer): void {
        this.selectedOffer = offer;
        this.counterAmount = null;
        this.counterMessage = "";
        this.counterVisible.set(true);
    }

    submitCounter(): void {
        if (!this.selectedOffer || !this.counterMessage.trim()) return;
        this.facade
            .counterOffer(this.listingId, this.selectedOffer.id, {
                counterAmount: this.counterAmount,
                counterMessage: this.counterMessage
            })
            .subscribe({
                next: () => {
                    this.counterVisible.set(false);
                    this.facade.loadOffers(this.listingId);
                    this.cd.markForCheck();
                }
            });
    }

    withdrawOffer(offer: MarketOffer): void {
        this.facade.withdrawOffer(this.listingId, offer.id).subscribe({
            next: () => {
                this.facade.loadOffers(this.listingId);
                this.cd.markForCheck();
            }
        });
    }

    submitComment(): void {
        if (!this.newComment.trim()) return;
        this.submittingComment = true;
        this.facade.addComment(this.listingId, this.newComment, this.replyToId).subscribe({
            next: () => {
                this.newComment = "";
                this.replyToId = null;
                this.submittingComment = false;
                this.facade.loadComments(this.listingId);
                this.cd.markForCheck();
            },
            error: () => {
                this.submittingComment = false;
                this.cd.markForCheck();
            }
        });
    }

    deleteComment(commentId: string): void {
        this.facade.deleteComment(this.listingId, commentId).subscribe({
            next: () => {
                this.facade.loadComments(this.listingId);
                this.cd.markForCheck();
            }
        });
    }

    submitReport(): void {
        if (!this.reportReason.trim()) return;
        this.facade.reportListing(this.listingId, this.reportReason).subscribe({
            next: () => {
                this.reportSuccess.set(true);
                this.cd.markForCheck();
            }
        });
    }

    submitRating(): void {
        this.facade
            .submitRating(this.listingId, {
                offerId: this.ratingOfferId,
                ratedUserId: this.ratingTargetUserId,
                score: this.ratingScore,
                text: this.ratingText
            })
            .subscribe({
                next: () => {
                    this.ratingVisible.set(false);
                    this.facade.loadRatings(this.listingId);
                    this.cd.markForCheck();
                }
            });
    }

    closeListing(): void {
        this.facade.closeListing(this.listingId).subscribe({
            next: () => {
                this.facade.loadListing(this.listingId);
                this.cd.markForCheck();
            }
        });
    }

    offerStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" {
        const m: Record<string, "success" | "info" | "warn" | "danger" | "secondary"> = {
            pending: "warn",
            accepted: "success",
            rejected: "danger",
            withdrawn: "secondary",
            countered: "info"
        };
        return m[status] ?? "secondary";
    }

    offerStatusLabel(status: string): string {
        return (
            (
                {
                    pending: "Ausstehend",
                    accepted: "Akzeptiert",
                    rejected: "Abgelehnt",
                    withdrawn: "Zurückgezogen",
                    countered: "Gegenangebot"
                } as Record<string, string>
            )[status] ?? status
        );
    }

    setReplyTo(id: string | null): void {
        this.replyToId = id;
    }

    openRatingDialog(offerId: string, targetUserId: string): void {
        this.ratingOfferId = offerId;
        this.ratingTargetUserId = targetUserId;
        this.ratingScore = 5;
        this.ratingText = "";
        this.ratingVisible.set(true);
    }
}
