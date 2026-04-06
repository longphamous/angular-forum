import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/models/jwt.model";
import { AddMediaDto, CreateAlbumDto, GalleryService } from "./gallery.service";

@ApiTags("Gallery")
@ApiBearerAuth("JWT")
@Controller("gallery")
export class GalleryController {
    constructor(private readonly galleryService: GalleryService) {}

    @Get("albums")
    getAlbums(@CurrentUser() user: AuthenticatedUser) {
        const isAdmin = user.role === "admin";
        return this.galleryService.getAlbums(user.userId, isAdmin);
    }

    @Post("albums")
    createAlbum(@CurrentUser() user: AuthenticatedUser, @Body() body: CreateAlbumDto) {
        return this.galleryService.createAlbum(user.userId, body);
    }

    @Get("albums/:id")
    getAlbum(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Query("password") password?: string) {
        const isAdmin = user.role === "admin";
        return this.galleryService.getAlbum(id, user.userId, isAdmin, password);
    }

    @Put("albums/:id")
    updateAlbum(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: CreateAlbumDto) {
        const isAdmin = user.role === "admin";
        return this.galleryService.updateAlbum(id, user.userId, isAdmin, body);
    }

    @Delete("albums/:id")
    deleteAlbum(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
        const isAdmin = user.role === "admin";
        return this.galleryService.deleteAlbum(id, user.userId, isAdmin);
    }

    @Post("albums/:albumId/media")
    addMedia(@Param("albumId") albumId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: AddMediaDto) {
        return this.galleryService.addMedia(albumId, user.userId, body);
    }

    @Delete("media/:id")
    deleteMedia(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
        const isAdmin = user.role === "admin";
        return this.galleryService.deleteMedia(id, user.userId, isAdmin);
    }

    @Get("media/:id/comments")
    getComments(@Param("id") id: string) {
        return this.galleryService.getComments(id);
    }

    @Post("media/:id/comments")
    addComment(
        @Param("id") mediaId: string,
        @CurrentUser() user: AuthenticatedUser,
        @Body() body: { content: string }
    ) {
        return this.galleryService.addComment(mediaId, user.userId, body.content);
    }

    @Patch("comments/:id")
    updateComment(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser, @Body() body: { content: string }) {
        const isAdmin = user.role === "admin";
        return this.galleryService.updateComment(id, user.userId, isAdmin, body.content);
    }

    @Delete("comments/:id")
    deleteComment(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
        const isAdmin = user.role === "admin";
        return this.galleryService.deleteComment(id, user.userId, isAdmin);
    }

    @Post("media/:id/rate")
    rateMedia(@Param("id") mediaId: string, @CurrentUser() user: AuthenticatedUser, @Body() body: { rating: number }) {
        return this.galleryService.rateMedia(mediaId, user.userId, body.rating);
    }
}
