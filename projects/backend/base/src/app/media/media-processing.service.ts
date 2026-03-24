import { Injectable, Logger } from "@nestjs/common";

export interface ProcessedVariant {
    variantKey: string;
    buffer: Buffer;
    mimeType: string;
    width?: number;
    height?: number;
}

export interface ImageMetadata {
    width: number;
    height: number;
    format: string;
}

@Injectable()
export class MediaProcessingService {
    private readonly logger = new Logger(MediaProcessingService.name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private sharp: any = null;

    async onModuleInit(): Promise<void> {
        try {
            // Dynamic require to avoid compile-time dependency on sharp
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            this.sharp = require("sharp");
            this.logger.log("Sharp loaded successfully – image processing enabled");
        } catch {
            this.logger.warn("Sharp not available – image processing disabled. Install sharp for image optimization.");
        }
    }

    async extractImageMetadata(buffer: Buffer): Promise<ImageMetadata | null> {
        if (!this.sharp) return null;
        try {
            const meta = await this.sharp(buffer).metadata();
            return {
                width: meta.width ?? 0,
                height: meta.height ?? 0,
                format: meta.format ?? "unknown"
            };
        } catch {
            return null;
        }
    }

    async generateImageVariants(buffer: Buffer): Promise<ProcessedVariant[]> {
        if (!this.sharp) return [];
        const variants: ProcessedVariant[] = [];

        try {
            // Thumbnail small (150x150 cover)
            const thumbSm = await this.sharp(buffer).resize(150, 150, { fit: "cover" }).jpeg({ quality: 80 }).toBuffer();
            variants.push({ variantKey: "thumb_sm", buffer: thumbSm, mimeType: "image/jpeg", width: 150, height: 150 });

            // Thumbnail medium (400x400 cover)
            const thumbMd = await this.sharp(buffer).resize(400, 400, { fit: "cover" }).jpeg({ quality: 85 }).toBuffer();
            variants.push({ variantKey: "thumb_md", buffer: thumbMd, mimeType: "image/jpeg", width: 400, height: 400 });

            // WebP (original dimensions, 80% quality)
            const webpInfo = await this.sharp(buffer).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
            variants.push({
                variantKey: "webp_1x",
                buffer: webpInfo.data,
                mimeType: "image/webp",
                width: webpInfo.info.width,
                height: webpInfo.info.height
            });

            // AVIF (original dimensions, 65% quality – best compression)
            const avifInfo = await this.sharp(buffer).avif({ quality: 65 }).toBuffer({ resolveWithObject: true });
            variants.push({
                variantKey: "avif_1x",
                buffer: avifInfo.data,
                mimeType: "image/avif",
                width: avifInfo.info.width,
                height: avifInfo.info.height
            });
        } catch (err) {
            this.logger.error("Error generating image variants", err);
        }

        return variants;
    }

    isImage(mimeType: string): boolean {
        return mimeType.startsWith("image/");
    }

    isVideo(mimeType: string): boolean {
        return mimeType.startsWith("video/");
    }
}
