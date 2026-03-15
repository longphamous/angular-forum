import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, UseGuards } from "@nestjs/common";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AddMediaDto, CreateAlbumDto, GalleryService } from "./gallery.service";

@Controller("gallery")
@UseGuards(JwtAuthGuard)
export class GalleryController {
    constructor(private readonly galleryService: GalleryService) {}

    @Get("albums")
    getAlbums(@Request() req: { user: { id: string; role: string } }) {
        const isAdmin = req.user.role === "admin";
        return this.galleryService.getAlbums(req.user.id, isAdmin);
    }

    @Post("albums")
    createAlbum(@Request() req: { user: { id: string } }, @Body() body: CreateAlbumDto) {
        return this.galleryService.createAlbum(req.user.id, body);
    }

    @Get("albums/:id")
    getAlbum(
        @Param("id") id: string,
        @Request() req: { user: { id: string; role: string } },
        @Query("password") password?: string
    ) {
        const isAdmin = req.user.role === "admin";
        return this.galleryService.getAlbum(id, req.user.id, isAdmin, password);
    }

    @Put("albums/:id")
    updateAlbum(
        @Param("id") id: string,
        @Request() req: { user: { id: string; role: string } },
        @Body() body: CreateAlbumDto
    ) {
        const isAdmin = req.user.role === "admin";
        return this.galleryService.updateAlbum(id, req.user.id, isAdmin, body);
    }

    @Delete("albums/:id")
    deleteAlbum(@Param("id") id: string, @Request() req: { user: { id: string; role: string } }) {
        const isAdmin = req.user.role === "admin";
        return this.galleryService.deleteAlbum(id, req.user.id, isAdmin);
    }

    @Post("albums/:albumId/media")
    addMedia(@Param("albumId") albumId: string, @Request() req: { user: { id: string } }, @Body() body: AddMediaDto) {
        return this.galleryService.addMedia(albumId, req.user.id, body);
    }

    @Delete("media/:id")
    deleteMedia(@Param("id") id: string, @Request() req: { user: { id: string; role: string } }) {
        const isAdmin = req.user.role === "admin";
        return this.galleryService.deleteMedia(id, req.user.id, isAdmin);
    }

    @Get("media/:id/comments")
    getComments(@Param("id") id: string) {
        return this.galleryService.getComments(id);
    }

    @Post("media/:id/comments")
    addComment(
        @Param("id") mediaId: string,
        @Request() req: { user: { id: string } },
        @Body() body: { content: string }
    ) {
        return this.galleryService.addComment(mediaId, req.user.id, body.content);
    }

    @Delete("comments/:id")
    deleteComment(@Param("id") id: string, @Request() req: { user: { id: string; role: string } }) {
        const isAdmin = req.user.role === "admin";
        return this.galleryService.deleteComment(id, req.user.id, isAdmin);
    }

    @Post("media/:id/rate")
    rateMedia(
        @Param("id") mediaId: string,
        @Request() req: { user: { id: string } },
        @Body() body: { rating: number }
    ) {
        return this.galleryService.rateMedia(mediaId, req.user.id, body.rating);
    }
}
