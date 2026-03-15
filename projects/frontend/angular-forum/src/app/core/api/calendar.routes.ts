export const CALENDAR_ROUTES = {
    list: (from?: string, to?: string) => {
        const params = new URLSearchParams();
        if (from) params.set("from", from);
        if (to) params.set("to", to);
        const qs = params.toString();
        return `/calendar${qs ? "?" + qs : ""}`;
    },
    my: () => "/calendar/my",
    myIcal: () => "/calendar/ical/feed",
    detail: (id: string) => `/calendar/${id}`,
    ical: (id: string) => `/calendar/${id}/ical`,
    create: () => "/calendar",
    update: (id: string) => `/calendar/${id}`,
    delete: (id: string) => `/calendar/${id}`,
    respond: (id: string) => `/calendar/${id}/respond`,
    invite: (id: string) => `/calendar/${id}/invite`,
    admin: {
        all: () => "/calendar/admin/all",
        update: (id: string) => `/calendar/admin/${id}`,
        delete: (id: string) => `/calendar/admin/${id}`
    }
} as const;
