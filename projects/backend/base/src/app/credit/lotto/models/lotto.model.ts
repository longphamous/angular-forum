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
}

export interface LottoTicket {
    id: string;
    userId: string;
    numbers: number[];
    superNumber: number;
    drawId: string;
    purchasedAt: string;
    cost: number;
}

export interface LottoDraw {
    id: string;
    drawDate: string;
    winningNumbers: number[];
    superNumber: number;
    jackpot: number;
    status: "pending" | "drawn";
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

export interface LottoResult {
    ticketId: string;
    userId: string;
    drawId: string;
    matchedNumbers: number[];
    matchedCount: number;
    superNumberMatched: boolean;
    prizeClass: LottoPrizeClass;
    prizeAmount: number;
}

export interface DrawResult {
    draw: LottoDraw;
    totalTickets: number;
    winners: LottoResult[];
    totalPrizesPaid: number;
}
