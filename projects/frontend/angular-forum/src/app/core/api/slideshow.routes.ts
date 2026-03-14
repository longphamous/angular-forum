export const SLIDESHOW_ROUTES = {
    active: () => "/slideshow",
    admin: {
        list: () => "/slideshow/admin",
        create: () => "/slideshow/admin",
        update: (id: string) => `/slideshow/admin/${id}`,
        delete: (id: string) => `/slideshow/admin/${id}`,
        upload: () => "/slideshow/admin/upload"
    }
} as const;
