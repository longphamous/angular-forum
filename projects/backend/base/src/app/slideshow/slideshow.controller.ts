import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    Param,
    Patch,
    Post,
    UploadedFile,
    UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { diskStorage } from "multer";
import { extname, join } from "path";

import { Public, Roles } from "../auth/auth.decorators";
import { CreateSlideDto, SlideshowService, TeaserSlideDto } from "./slideshow.service";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

@ApiTags("Admin")
@ApiBearerAuth("JWT")
@Controller("slideshow")
export class SlideshowController {
    constructor(private readonly slideshowService: SlideshowService) {}

    // ── Public ────────────────────────────────────────────────────────────────

    @Public()
    @Get()
    getActive(): Promise<TeaserSlideDto[]> {
        return this.slideshowService.findActive();
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    @Roles("admin")
    @Get("admin")
    getAll(): Promise<TeaserSlideDto[]> {
        return this.slideshowService.findAll();
    }

    @Roles("admin")
    @Post("admin")
    create(@Body() dto: CreateSlideDto): Promise<TeaserSlideDto> {
        if (!dto.title?.trim() || !dto.imageUrl?.trim()) {
            throw new BadRequestException("title and imageUrl are required");
        }
        return this.slideshowService.create(dto);
    }

    @Roles("admin")
    @Patch("admin/:id")
    update(@Param("id") id: string, @Body() dto: Partial<CreateSlideDto>): Promise<TeaserSlideDto> {
        return this.slideshowService.update(id, dto);
    }

    @Roles("admin")
    @Delete("admin/:id")
    @HttpCode(204)
    delete(@Param("id") id: string): Promise<void> {
        return this.slideshowService.delete(id);
    }

    @Roles("admin")
    @Post("admin/upload")
    @UseInterceptors(
        FileInterceptor("file", {
            storage: diskStorage({
                destination: join(process.cwd(), "uploads", "slideshow"),
                filename: (_req, file, cb) => {
                    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
                    cb(null, `${unique}${extname(file.originalname)}`);
                }
            }),
            fileFilter: (_req, file, cb) => {
                if (!ALLOWED_MIME.has(file.mimetype)) {
                    cb(new BadRequestException("Only image files are allowed"), false);
                } else {
                    cb(null, true);
                }
            },
            limits: { fileSize: 10 * 1024 * 1024 }
        })
    )
    uploadImage(@UploadedFile() file: Express.Multer.File): { url: string } {
        if (!file) throw new BadRequestException("No file uploaded");
        return { url: `/uploads/slideshow/${file.filename}` };
    }
}
