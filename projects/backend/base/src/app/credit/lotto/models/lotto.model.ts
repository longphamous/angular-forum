// 0 = Sunday … 6 = Saturday (matches JS Date.getDay())
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DrawScheduleConfig {
    /** Days of the week on which a draw takes place, e.g. [3, 6] for Wed & Sat */
    drawDays: Weekday[];
    /** Hour (UTC, 0-23) at which each draw fires */
    drawHourUtc: number;
    /** Minute (0-59) at which each draw fires */
    drawMinuteUtc: number;
    /** Starting jackpot for a fresh draw when no rollover exists */
    baseJackpot: number;
    /**
     * Percentage of ticket-revenue that is added to the jackpot pool
     * when there is no class-1 winner.  Value 0–100, default 50.
     */
    rolloverPercentage: number;
    /** Cost per ticket in virtual credits */
    ticketCost: number;
}

export interface LottoTicket {
    id: string;
    userId: string;
    /** Array of fields, each containing 6 numbers. Max 12 fields per ticket. */
    fields: number[][];
    superNumber: number;
    drawId: string;
    purchasedAt: string;
    cost: number;
    totalDraws?: number;
    groupId?: string;
}

export interface LottoDraw {
    id: string;
    drawDate: string;
    winningNumbers: number[];
    superNumber: number;
    jackpot: number;
    status: "pending" | "drawn";
    totalTickets?: number;
}

export type LottoPrizeClass =
    | "class1"
    | "class2"
    | "class3"
    | "class4"
    | "class5"
    | "class6"
    | "class7"
    | "class8"
    | "class9"
    | "no_win";

export interface LottoFieldResult {
    fieldIndex: number;
    numbers: number[];
    matchedNumbers: number[];
    matchedCount: number;
    superNumberMatched: boolean;
    prizeClass: LottoPrizeClass;
    prizeAmount: number;
}

export interface LottoResult {
    ticketId: string;
    userId: string;
    drawId: string;
    /** Best result across all fields (for backward compat / summary). */
    matchedNumbers: number[];
    matchedCount: number;
    superNumberMatched: boolean;
    prizeClass: LottoPrizeClass;
    prizeAmount: number;
    /** Per-field breakdown. */
    fieldResults: LottoFieldResult[];
}

export interface DrawResult {
    draw: LottoDraw;
    totalTickets: number;
    winners: LottoResult[];
    totalPrizesPaid: number;
}

export interface NumberFrequencyEntry {
    number: number;
    count: number;
}

export interface LottoStats {
    totalDraws: number;
    totalTicketsSold: number;
    totalPrizePaid: number;
    biggestJackpot: number;
    lastDraw: LottoDraw | null;
    nextDraw: LottoDraw | null;
    hotNumbers: number[];
    coldNumbers: number[];
    numberFrequency: NumberFrequencyEntry[];
}

export type SpecialDrawTicketMode = "all_current" | "separate";
export type SpecialDrawPrizeMode = "standard" | "custom_jackpot" | "single_class";

export interface SpecialDraw {
    id: string;
    name: string;
    drawDate: string;
    ticketMode: SpecialDrawTicketMode;
    prizeMode: SpecialDrawPrizeMode;
    customJackpot?: number;
    singlePrizeClass?: LottoPrizeClass;
    singlePrizeAmount?: number;
    ticketCost?: number;
    status: "pending" | "drawn";
    winningNumbers?: number[];
    superNumber?: number;
    totalTickets?: number;
    createdAt: string;
}

export interface CreateSpecialDrawDto {
    name: string;
    drawDate: string;
    ticketMode: SpecialDrawTicketMode;
    prizeMode: SpecialDrawPrizeMode;
    customJackpot?: number;
    singlePrizeClass?: LottoPrizeClass;
    singlePrizeAmount?: number;
    ticketCost?: number;
}

export interface SpecialDrawResult {
    draw: SpecialDraw;
    totalTickets: number;
    winners: LottoResult[];
    totalPrizesPaid: number;
}

export interface DrawHistoryEntry {
    id: string;
    type: "regular" | "special";
    name?: string;
    drawDate: string;
    winningNumbers: number[];
    superNumber: number;
    jackpot: number;
    totalTickets: number;
    totalWinners: number;
    totalPrizesPaid: number;
    winnersByClass: { prizeClass: LottoPrizeClass; count: number; amount: number }[];
}
