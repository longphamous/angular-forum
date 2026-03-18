import { ChronikEntryType, ChronikVisibility } from "../models/chronik.model";

export class CreateEntryDto {
    content!: string;
    type: ChronikEntryType = "text";
    imageUrl?: string;
    linkUrl?: string;
    linkTitle?: string;
    linkDescription?: string;
    linkImageUrl?: string;
    linkDomain?: string;
    visibility: ChronikVisibility = "public";
}

export class CreateCommentDto {
    content!: string;
    parentId?: string;
}

export class ChronikQueryDto {
    limit?: number;
    offset?: number;
    userId?: string;
    feed?: boolean;
}
