export const MEDIA_ROUTES = {
    upload: () => "/media/upload",
    browse: () => "/media/browse",
    asset: (id: string) => `/media/${id}`,
    userMedia: (userId: string) => `/media/user/${userId}`,
    updateAccess: (id: string) => `/media/${id}/access`,
    adminStorageConfig: () => "/media/admin/storage-config",
    adminTestConnection: () => "/media/admin/storage-config/test"
} as const;
