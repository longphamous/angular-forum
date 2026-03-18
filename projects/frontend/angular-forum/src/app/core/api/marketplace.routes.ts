const BASE = "/api/marketplace";

export const MARKETPLACE_ROUTES = {
    categories: `${BASE}/categories`,
    listings: {
        list: `${BASE}/listings`,
        my: `${BASE}/listings/my`,
        myOffers: `${BASE}/listings/my-offers`,
        detail: (id: string) => `${BASE}/listings/${id}`,
        close: (id: string) => `${BASE}/listings/${id}/close`,
        offers: (id: string) => `${BASE}/listings/${id}/offers`,
        offer: (id: string, offerId: string) => `${BASE}/listings/${id}/offers/${offerId}`,
        offerAccept: (id: string, offerId: string) => `${BASE}/listings/${id}/offers/${offerId}/accept`,
        offerReject: (id: string, offerId: string) => `${BASE}/listings/${id}/offers/${offerId}/reject`,
        offerCounter: (id: string, offerId: string) => `${BASE}/listings/${id}/offers/${offerId}/counter`,
        comments: (id: string) => `${BASE}/listings/${id}/comments`,
        comment: (id: string, commentId: string) => `${BASE}/listings/${id}/comments/${commentId}`,
        report: (id: string) => `${BASE}/listings/${id}/report`,
        ratings: (id: string) => `${BASE}/listings/${id}/ratings`
    },
    admin: {
        pending: `${BASE}/admin/pending`,
        approve: (id: string) => `${BASE}/admin/${id}/approve`,
        reject: (id: string) => `${BASE}/admin/${id}/reject`,
        reports: `${BASE}/admin/reports`,
        actionReport: (id: string) => `${BASE}/admin/reports/${id}`
    }
} as const;
