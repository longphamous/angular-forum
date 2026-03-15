import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Param,
    Post,
    Put,
    Query,
    Request,
    UseGuards
} from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { BlogService, CreateCategoryDto, CreatePostDto, UpdatePostDto } from "./blog.service";
import { BlogStatus, BlogType } from "./entities/blog-post.entity";

@Controller("blog")
@UseGuards(JwtAuthGuard)
export class BlogController {
    constructor(private readonly blogService: BlogService) {}

    @Get("posts")
    getPosts(
        @Request() req: { user: { id: string; role: string } },
        @Query("type") type?: BlogType,
        @Query("categoryId") categoryId?: string,
        @Query("authorId") authorId?: string,
        @Query("status") status?: BlogStatus
    ) {
        const isAdmin = req.user.role === "admin";
        return this.blogService.getPosts({ userId: req.user.id, isAdmin, type, categoryId, authorId, status });
    }

    @Post("posts")
    createPost(@Request() req: { user: { id: string } }, @Body() dto: CreatePostDto) {
        return this.blogService.createPost(req.user.id, dto);
    }

    @Get("posts/:slug")
    getPost(@Param("slug") slug: string, @Request() req: { user: { id: string; role: string } }) {
        return this.blogService.getPostBySlug(slug, req.user.id, req.user.role === "admin");
    }

    @Put("posts/:id")
    updatePost(
        @Param("id") id: string,
        @Request() req: { user: { id: string; role: string } },
        @Body() dto: UpdatePostDto
    ) {
        return this.blogService.updatePost(id, req.user.id, req.user.role === "admin", dto);
    }

    @Delete("posts/:id")
    deletePost(@Param("id") id: string, @Request() req: { user: { id: string; role: string } }) {
        return this.blogService.deletePost(id, req.user.id, req.user.role === "admin");
    }

    @Get("categories")
    getCategories() {
        return this.blogService.getCategories();
    }

    @Post("categories")
    createCategory(@Request() req: { user: { role: string } }, @Body() dto: CreateCategoryDto) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.blogService.createCategory(dto);
    }

    @Put("categories/:id")
    updateCategory(
        @Param("id") id: string,
        @Request() req: { user: { role: string } },
        @Body() dto: Partial<CreateCategoryDto>
    ) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.blogService.updateCategory(id, dto);
    }

    @Delete("categories/:id")
    deleteCategory(@Param("id") id: string, @Request() req: { user: { role: string } }) {
        if (req.user.role !== "admin") throw new ForbiddenException();
        return this.blogService.deleteCategory(id);
    }

    @Get("posts/:postId/comments")
    getComments(@Param("postId") postId: string) {
        return this.blogService.getComments(postId);
    }

    @Post("posts/:postId/comments")
    addComment(
        @Param("postId") postId: string,
        @Request() req: { user: { id: string } },
        @Body() body: { content: string; parentId?: string }
    ) {
        return this.blogService.addComment(postId, req.user.id, body.content, body.parentId);
    }

    @Delete("comments/:id")
    deleteComment(@Param("id") id: string, @Request() req: { user: { id: string; role: string } }) {
        return this.blogService.deleteComment(id, req.user.id, req.user.role === "admin");
    }
}
