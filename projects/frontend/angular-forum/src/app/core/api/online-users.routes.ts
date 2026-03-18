import { OnlineSort, OnlineSortOrder, OnlineTimeWindow } from "../models/user/online-user";

export const ONLINE_USERS_ROUTES = {
    online: (opts?: { window?: OnlineTimeWindow; sort?: OnlineSort; order?: OnlineSortOrder; limit?: number }) => {
        const p = new URLSearchParams();
        if (opts?.window) p.set("window", opts.window);
        if (opts?.sort) p.set("sort", opts.sort);
        if (opts?.order) p.set("order", opts.order);
        if (opts?.limit != null) p.set("limit", String(opts.limit));
        const qs = p.toString();
        return `/user/online${qs ? "?" + qs : ""}`;
    }
} as const;
