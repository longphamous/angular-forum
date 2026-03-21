export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

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

export interface DrawScheduleConfig {
    drawDays: Weekday[];
    drawHourUtc: number;
    drawMinuteUtc: number;
    baseJackpot: number;
    rolloverPercentage: number;
    ticketCost: number;
}

export interface LottoTicket {
    id: string;
    userId: string;
    fields: number[][];
    superNumber: number;
    drawId: string;
    purchasedAt: string;
    cost: number;
    totalDraws?: number;
    groupId?: string;
    remainingDraws?: number;
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
    matchedNumbers: number[];
    matchedCount: number;
    superNumberMatched: boolean;
    prizeClass: LottoPrizeClass;
    prizeAmount: number;
    fieldResults?: LottoFieldResult[];
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

export interface MyTicketWithResult {
    ticket: LottoTicket;
    draw: LottoDraw;
    result?: LottoResult;
}

export interface TicketDrawGroup {
    draw: LottoDraw;
    tickets: MyTicketWithResult[];
    totalPrize: number;
}

export interface PrizeClassInfo {
    label: string;
    description: string;
    amount: number;
}

export const PRIZE_CLASS_INFO: Record<LottoPrizeClass, PrizeClassInfo> = {
    class1: { label: "lotto.prizeClass.class1", description: "lotto.prizeDesc.class1", amount: 10_000_000 },
    class2: { label: "lotto.prizeClass.class2", description: "lotto.prizeDesc.class2", amount: 500_000 },
    class3: { label: "lotto.prizeClass.class3", description: "lotto.prizeDesc.class3", amount: 100_000 },
    class4: { label: "lotto.prizeClass.class4", description: "lotto.prizeDesc.class4", amount: 5_000 },
    class5: { label: "lotto.prizeClass.class5", description: "lotto.prizeDesc.class5", amount: 500 },
    class6: { label: "lotto.prizeClass.class6", description: "lotto.prizeDesc.class6", amount: 50 },
    class7: { label: "lotto.prizeClass.class7", description: "lotto.prizeDesc.class7", amount: 20 },
    class8: { label: "lotto.prizeClass.class8", description: "lotto.prizeDesc.class8", amount: 10 },
    class9: { label: "lotto.prizeClass.class9", description: "lotto.prizeDesc.class9", amount: 5 },
    no_win: { label: "lotto.prizeClass.no_win", description: "lotto.prizeDesc.no_win", amount: 0 }
};

export const PRIZE_CLASSES: LottoPrizeClass[] = [
    "class1",
    "class2",
    "class3",
    "class4",
    "class5",
    "class6",
    "class7",
    "class8",
    "class9"
];

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
