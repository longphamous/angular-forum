export const SHOP_ROUTES = {
    active: () => "/shop",
    purchase: (itemId: string) => `/shop/purchase/${itemId}`,
    inventory: () => "/shop/inventory",
    admin: {
        list: () => "/shop/admin",
        create: () => "/shop/admin",
        update: (id: string) => `/shop/admin/${id}`,
        delete: (id: string) => `/shop/admin/${id}`,
        allInventory: () => "/shop/admin/inventory/all"
    }
} as const;
