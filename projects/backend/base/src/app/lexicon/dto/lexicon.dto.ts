import { LexiconArticleStatus } from "../entities/lexicon-article.entity";
import { LexiconCustomFieldDefinition } from "../entities/lexicon-category.entity";

export interface CreateArticleDto {
    title: string;
    content: string;
    categoryId: string;
    language?: string;
    excerpt?: string;
    tags?: string[];
    customFieldValues?: Record<string, unknown>;
    linkedArticleId?: string;
    coverImageUrl?: string;
    allowComments?: boolean;
    status?: LexiconArticleStatus;
    changeSummary?: string;
}

export type UpdateArticleDto = Partial<CreateArticleDto> & { changeSummary?: string };

export interface CreateCategoryDto {
    name: string;
    description?: string;
    parentId?: string;
    position?: number;
    customFields?: LexiconCustomFieldDefinition[];
}

export interface ArticleQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    language?: string;
    status?: LexiconArticleStatus;
    tag?: string;
    authorId?: string;
}

export interface CreateCommentDto {
    content: string;
    parentId?: string;
}

export interface ReportArticleDto {
    reason: string;
}

export interface ModerateArticleDto {
    reason?: string;
}

export interface UpdateTermsDto {
    content: string;
}

export interface ResolveReportDto {
    status: "resolved" | "dismissed";
}
