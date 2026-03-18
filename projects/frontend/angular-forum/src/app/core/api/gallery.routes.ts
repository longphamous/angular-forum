export const GALLERY_ROUTES = {
    albums: () => "/gallery/albums",
    album: (id: string) => `/gallery/albums/${id}`,
    albumMedia: (albumId: string) => `/gallery/albums/${albumId}/media`,
    media: (id: string) => `/gallery/media/${id}`,
    mediaComments: (id: string) => `/gallery/media/${id}/comments`,
    comment: (id: string) => `/gallery/comments/${id}`,
    rateMedia: (id: string) => `/gallery/media/${id}/rate`
} as const;
