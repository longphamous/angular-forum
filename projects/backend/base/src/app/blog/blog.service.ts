import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { BlogCategoryEntity } from "./entities/blog-category.entity";
import { BlogCommentEntity } from "./entities/blog-comment.entity";
import { BlogPostEntity, BlogStatus, BlogType } from "./entities/blog-post.entity";

export interface CreatePostDto {
    title: string;
    content: string;
    excerpt?: string;
    type?: BlogType;
    status?: BlogStatus;
    categoryId?: string;
    coverImageUrl?: string;
    tags?: string[];
    allowComments?: boolean;
}

export type UpdatePostDto = Partial<CreatePostDto>;

export interface EnrichedComment {
    id: string;
    postId: string;
    authorId: string;
    authorName: string;
    authorAvatar: string | null;
    content: string;
    parentId: string | null;
    replies: EnrichedComment[];
    createdAt: string;
    updatedAt: string;
}

export interface CreateCategoryDto {
    name: string;
    slug: string;
    description?: string;
    color?: string;
}

@Injectable()
export class BlogService {
    constructor(
        @InjectRepository(BlogPostEntity)
        private readonly postRepo: Repository<BlogPostEntity>,
        @InjectRepository(BlogCategoryEntity)
        private readonly categoryRepo: Repository<BlogCategoryEntity>,
        @InjectRepository(BlogCommentEntity)
        private readonly commentRepo: Repository<BlogCommentEntity>,
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>
    ) {}

    async getPosts(options: {
        userId: string;
        isAdmin: boolean;
        type?: BlogType;
        categoryId?: string;
        authorId?: string;
        status?: BlogStatus;
    }): Promise<object[]> {
        const qb = this.postRepo.createQueryBuilder("p").leftJoinAndSelect("p.category", "c");

        if (!options.isAdmin) {
            qb.where("p.status = 'published'");
        } else if (options.status) {
            qb.where("p.status = :status", { status: options.status });
        }

        if (options.type) qb.andWhere("p.type = :type", { type: options.type });
        if (options.categoryId) qb.andWhere("p.categoryId = :categoryId", { categoryId: options.categoryId });
        if (options.authorId) qb.andWhere("p.authorId = :authorId", { authorId: options.authorId });

        qb.orderBy("p.publishedAt", "DESC").addOrderBy("p.createdAt", "DESC");

        const posts = await qb.getMany();
        return Promise.all(posts.map((p) => this.enrichPost(p, options.userId)));
    }

    async getPostBySlug(slug: string, userId: string, isAdmin: boolean): Promise<object> {
        const qb = this.postRepo
            .createQueryBuilder("p")
            .leftJoinAndSelect("p.category", "c")
            .where("p.slug = :slug", { slug });

        if (!isAdmin) qb.andWhere("p.status = 'published'");

        const post = await qb.getOne();
        if (!post) throw new NotFoundException("Post not found");

        if (!isAdmin && post.status !== "published" && post.authorId !== userId) {
            throw new NotFoundException("Post not found");
        }

        await this.postRepo.increment({ id: post.id }, "viewCount", 1);
        post.viewCount++;

        const comments = await this.commentRepo.find({ where: { postId: post.id }, order: { createdAt: "ASC" } });
        const enrichedComments = await Promise.all(comments.map((c) => this.enrichComment(c)));

        const topLevel = enrichedComments.filter((c: EnrichedComment) => !c.parentId);
        const byParent = new Map<string, EnrichedComment[]>();
        enrichedComments
            .filter((c: EnrichedComment) => c.parentId)
            .forEach((c: EnrichedComment) => {
                const arr = byParent.get(c.parentId as string) ?? [];
                arr.push(c);
                byParent.set(c.parentId as string, arr);
            });
        const nested = topLevel.map((c: EnrichedComment) => ({ ...c, replies: byParent.get(c.id) ?? [] }));

        const enriched = await this.enrichPost(post, userId);
        return { ...enriched, comments: nested };
    }

    async createPost(authorId: string, dto: CreatePostDto): Promise<object> {
        const slug = this.generateSlug(dto.title);
        const post = this.postRepo.create({
            title: dto.title,
            slug,
            content: dto.content,
            excerpt: dto.excerpt ?? null,
            type: dto.type ?? "personal",
            status: dto.status ?? "draft",
            authorId,
            categoryId: dto.categoryId ?? null,
            coverImageUrl: dto.coverImageUrl ?? null,
            tags: dto.tags ?? [],
            allowComments: dto.allowComments ?? true,
            publishedAt: dto.status === "published" ? new Date() : null
        });
        const saved = await this.postRepo.save(post);
        return this.enrichPost(saved, authorId);
    }

    async updatePost(id: string, userId: string, isAdmin: boolean, dto: UpdatePostDto): Promise<object> {
        const post = await this.postRepo.findOne({ where: { id }, relations: ["category"] });
        if (!post) throw new NotFoundException("Post not found");
        if (!isAdmin && post.authorId !== userId) throw new ForbiddenException("Access denied");

        if (dto.title && dto.title !== post.title) post.slug = this.generateSlug(dto.title);
        if (dto.title !== undefined) post.title = dto.title;
        if (dto.content !== undefined) post.content = dto.content;
        if (dto.excerpt !== undefined) post.excerpt = dto.excerpt ?? null;
        if (dto.type !== undefined) post.type = dto.type;
        if (dto.status !== undefined) {
            if (post.status !== "published" && dto.status === "published") post.publishedAt = new Date();
            post.status = dto.status;
        }
        if (dto.categoryId !== undefined) post.categoryId = dto.categoryId ?? null;
        if (dto.coverImageUrl !== undefined) post.coverImageUrl = dto.coverImageUrl ?? null;
        if (dto.tags !== undefined) post.tags = dto.tags;
        if (dto.allowComments !== undefined) post.allowComments = dto.allowComments;

        const saved = await this.postRepo.save(post);
        return this.enrichPost(saved, userId);
    }

    async deletePost(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const post = await this.postRepo.findOne({ where: { id } });
        if (!post) throw new NotFoundException("Post not found");
        if (!isAdmin && post.authorId !== userId) throw new ForbiddenException("Access denied");
        await this.postRepo.remove(post);
    }

    async getCategories(): Promise<object[]> {
        const cats = await this.categoryRepo.find({ order: { name: "ASC" } });
        return Promise.all(
            cats.map(async (c) => {
                const postCount = await this.postRepo.count({ where: { categoryId: c.id, status: "published" } });
                return { ...c, postCount };
            })
        );
    }

    async createCategory(dto: CreateCategoryDto): Promise<BlogCategoryEntity> {
        const cat = this.categoryRepo.create(dto);
        return this.categoryRepo.save(cat);
    }

    async updateCategory(id: string, dto: Partial<CreateCategoryDto>): Promise<BlogCategoryEntity> {
        const cat = await this.categoryRepo.findOne({ where: { id } });
        if (!cat) throw new NotFoundException("Category not found");
        Object.assign(cat, dto);
        return this.categoryRepo.save(cat);
    }

    async deleteCategory(id: string): Promise<void> {
        const cat = await this.categoryRepo.findOne({ where: { id } });
        if (!cat) throw new NotFoundException("Category not found");
        await this.postRepo
            .createQueryBuilder()
            .update()
            .set({ categoryId: () => "NULL" })
            .where("categoryId = :id", { id })
            .execute();
        await this.categoryRepo.remove(cat);
    }

    async getComments(postId: string): Promise<object[]> {
        const comments = await this.commentRepo.find({ where: { postId }, order: { createdAt: "ASC" } });
        return Promise.all(comments.map((c) => this.enrichComment(c)));
    }

    async addComment(postId: string, authorId: string, content: string, parentId?: string): Promise<object> {
        const post = await this.postRepo.findOne({ where: { id: postId } });
        if (!post) throw new NotFoundException("Post not found");
        if (!post.allowComments) throw new ForbiddenException("Comments are disabled for this post");

        const comment = this.commentRepo.create({ postId, authorId, content, parentId: parentId ?? null });
        const saved = await this.commentRepo.save(comment);
        return this.enrichComment(saved);
    }

    async deleteComment(id: string, userId: string, isAdmin: boolean): Promise<void> {
        const comment = await this.commentRepo.findOne({ where: { id } });
        if (!comment) throw new NotFoundException("Comment not found");
        if (!isAdmin && comment.authorId !== userId) throw new ForbiddenException("Access denied");
        await this.commentRepo.remove(comment);
    }

    private async enrichPost(post: BlogPostEntity, userId: string): Promise<object> {
        const author = await this.userRepo.findOne({ where: { id: post.authorId } });
        const commentCount = await this.commentRepo.count({ where: { postId: post.id } });
        const category =
            post.category ??
            (post.categoryId ? await this.categoryRepo.findOne({ where: { id: post.categoryId } }) : null);

        return {
            id: post.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            type: post.type,
            status: post.status,
            authorId: post.authorId,
            authorName: author?.displayName ?? author?.username ?? "Unknown",
            authorAvatar: author?.avatarUrl ?? null,
            categoryId: post.categoryId,
            categoryName: category?.name ?? null,
            categoryColor: category?.color ?? null,
            coverImageUrl: post.coverImageUrl,
            tags: post.tags,
            viewCount: post.viewCount,
            commentCount,
            allowComments: post.allowComments,
            isOwner: post.authorId === userId,
            publishedAt: post.publishedAt?.toISOString() ?? null,
            createdAt: post.createdAt.toISOString(),
            updatedAt: post.updatedAt.toISOString()
        };
    }

    private async enrichComment(comment: BlogCommentEntity): Promise<EnrichedComment> {
        const author = await this.userRepo.findOne({ where: { id: comment.authorId } });
        return {
            id: comment.id,
            postId: comment.postId,
            authorId: comment.authorId,
            authorName: author?.displayName ?? author?.username ?? "Unknown",
            authorAvatar: author?.avatarUrl ?? null,
            content: comment.content,
            parentId: comment.parentId,
            replies: [],
            createdAt: comment.createdAt.toISOString(),
            updatedAt: comment.updatedAt.toISOString()
        };
    }

    private generateSlug(title: string): string {
        const base = title
            .toLowerCase()
            .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");
        return `${base}-${Date.now()}`;
    }
}
