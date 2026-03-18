export type AlbumAccess = "public" | "members_only" | "private";
export type MediaType = "image" | "video" | "youtube";

export interface GalleryAlbum {
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    coverUrl?: string | null;
    ownerId: string;
    ownerName: string;
    ownerAvatar?: string | null;
    accessLevel: AlbumAccess;
    watermarkEnabled: boolean;
    allowComments: boolean;
    allowRatings: boolean;
    allowDownload: boolean;
    tags: string[];
    mediaCount: number;
    isOwner: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface GalleryMedia {
    id: string;
    albumId: string;
    ownerId: string;
    type: MediaType;
    url: string;
    youtubeId?: string | null;
    title?: string | null;
    description?: string | null;
    filename?: string | null;
    mimeType?: string | null;
    fileSize?: number | null;
    width?: number | null;
    height?: number | null;
    takenAt?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    sortOrder: number;
    commentCount: number;
    averageRating: number;
    userRating?: number | null;
    isOwner: boolean;
    createdAt: string;
}

export interface GalleryComment {
    id: string;
    mediaId: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string | null;
    content: string;
    createdAt: string;
}

export interface GalleryAlbumDetail extends GalleryAlbum {
    media: GalleryMedia[];
}

export interface CreateAlbumPayload {
    title: string;
    description?: string;
    category?: string;
    accessLevel: AlbumAccess;
    password?: string;
    watermarkEnabled: boolean;
    allowComments: boolean;
    allowRatings: boolean;
    allowDownload: boolean;
    tags: string[];
}

export interface AddMediaPayload {
    type: MediaType;
    url: string;
    youtubeId?: string;
    title?: string;
    description?: string;
    filename?: string;
    mimeType?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    takenAt?: string;
    latitude?: number;
    longitude?: number;
    sortOrder?: number;
}

export interface AddCommentPayload {
    content: string;
}

export interface RateMediaPayload {
    rating: number;
}
