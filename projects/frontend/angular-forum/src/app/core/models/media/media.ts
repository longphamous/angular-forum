export type MediaAccessLevel = "public" | "members_only" | "private" | "unlisted";
export type SourceModule =
    | "blog"
    | "gallery"
    | "clips"
    | "user"
    | "chronik"
    | "marketplace"
    | "slideshow"
    | "shop"
    | "recipes"
    | "lexicon"
    | "tcg"
    | "forum"
    | "general";

export interface MediaVariant {
    variantKey: string;
    mimeType: string;
    fileSize: number;
    width: number | null;
    height: number | null;
    url: string;
}

export interface MediaAsset {
    id: string;
    ownerId: string;
    ownerName: string;
    originalFilename: string;
    mimeType: string;
    fileSize: number;
    width: number | null;
    height: number | null;
    duration: number | null;
    sourceModule: string;
    category: string | null;
    accessLevel: MediaAccessLevel;
    altText: string | null;
    tags: string[];
    isProcessed: boolean;
    url: string;
    variants: MediaVariant[];
    createdAt: string;
}

export interface PaginatedMedia {
    data: MediaAsset[];
    total: number;
}

export interface UploadMediaOptions {
    sourceModule: SourceModule;
    category?: string;
    accessLevel?: MediaAccessLevel;
    altText?: string;
    tags?: string[];
}

export interface UploadProgress {
    fileId: string;
    filename: string;
    loaded: number;
    total: number;
    percent: number;
    status: "pending" | "uploading" | "processing" | "complete" | "error";
    asset?: MediaAsset;
    error?: string;
}
