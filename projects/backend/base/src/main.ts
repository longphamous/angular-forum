import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

import { AppModule } from "./app/app.module";

async function bootstrap(): Promise<void> {
    const logger = new Logger("Bootstrap");

    try {
        const app = await NestFactory.create<NestExpressApplication>(AppModule, {
            logger: ["error", "warn", "log", "debug"]
        });

        // Validate critical env vars
        const jwtSecret = process.env["JWT_SECRET"];
        if (!jwtSecret || jwtSecret.length < 16) {
            logger.warn("JWT_SECRET is missing or too short (< 16 chars). Set it in .env for production!");
        }

        // CORS - restrict to configured origins
        const corsOrigins = process.env["CORS_ORIGINS"]?.split(",").map((o) => o.trim()) ?? [];
        app.enableCors({
            origin: corsOrigins.length > 0 ? corsOrigins : true,
            credentials: true,
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            allowedHeaders: ["Content-Type", "Authorization"]
        });

        app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });
        app.enableShutdownHooks();

        // Global validation
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: false,
                transform: true,
                transformOptions: { enableImplicitConversion: true }
            })
        );

        const globalPrefix = "api";
        app.setGlobalPrefix(globalPrefix);

        const port = process.env["PORT"] ?? 3000;
        await app.listen(port);

        logger.log("═══════════════════════════════════════════════");
        logger.log(`  Aniverse API running on http://localhost:${port}/${globalPrefix}`);

        const pushMode = process.env["PUSH_MODE"] ?? (process.env["PUSH_ENABLED"] === "false" ? "disabled" : "embedded");
        if (pushMode === "embedded") {
            logger.log(`  WebSocket gateway on ws://localhost:${port}/push`);
        } else if (pushMode === "remote") {
            logger.log(`  Push: remote → ${process.env["PUSH_SERVER_URL"] ?? "http://localhost:3001"}`);
        } else {
            logger.log("  Push: disabled");
        }

        logger.log(`  Environment: ${process.env["NODE_ENV"] ?? "development"}`);
        logger.log("═══════════════════════════════════════════════");
    } catch (err) {
        logger.error("Failed to start application", (err as Error).stack);
        process.exit(1);
    }
}

// Handle unhandled rejections and exceptions
process.on("unhandledRejection", (reason) => {
    const logger = new Logger("UnhandledRejection");
    logger.error(`Unhandled promise rejection: ${reason}`);
});

process.on("uncaughtException", (err) => {
    const logger = new Logger("UncaughtException");
    logger.error(`Uncaught exception: ${err.message}`, err.stack);
    process.exit(1);
});

bootstrap();
