export const LOTTO_ROUTES = {
    config: () => "/credit/lotto/config",
    stats: () => "/credit/lotto/stats",
    draws: () => "/credit/lotto/draws",
    draw: (id: string) => `/credit/lotto/draws/${id}`,
    scheduleNextDraw: () => "/credit/lotto/draws",
    performDraw: (id: string) => `/credit/lotto/draws/${id}/perform`,
    drawResults: (id: string) => `/credit/lotto/draws/${id}/results`,
    myTickets: () => "/credit/lotto/my-tickets",
    purchaseTicket: () => "/credit/lotto/tickets",
    myResults: (drawId?: string) => (drawId ? `/credit/lotto/my-results?drawId=${drawId}` : "/credit/lotto/my-results")
} as const;
