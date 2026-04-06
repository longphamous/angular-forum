import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
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

        // ── Swagger / OpenAPI ─────────────────────────────────────────────────
        const swaggerConfig = new DocumentBuilder()
            .setTitle("Aniverse API")
            .setDescription("Backend API for the Aniverse community platform")
            .setVersion("1.0")
            .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" }, "JWT")
            .addTag("Users", "User profiles, authentication & autocomplete")
            .addTag("Forum", "Forum categories, threads, posts")
            .addTag("Gamification", "XP, levels, achievements, bounty")
            .addTag("RPG", "Character system, quests, equipment")
            .addTag("Shop", "Virtual shop & inventory")
            .addTag("Credit", "Wallet, coins, transactions")
            .addTag("Hashtags", "Hashtag system")
            .addTag("Notifications", "Push & in-app notifications")
            .addTag("Feed", "Activity feed & dashboard")
            .addTag("Blog", "Blog posts & comments")
            .addTag("Gallery", "Photo albums & media")
            .addTag("Lexicon", "Wiki articles")
            .addTag("Marketplace", "Listings & auctions")
            .addTag("Calendar", "Events & calendar")
            .addTag("Messages", "Private messaging")
            .addTag("Friends", "Friend system")
            .addTag("Clans", "Clan management")
            .addTag("Lotto", "Lottery system")
            .addTag("TCG", "Trading card game")
            .addTag("Tickets", "Issue tracking & project management")
            .build();

        const document = SwaggerModule.createDocument(app, swaggerConfig);
        SwaggerModule.setup("docs", app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                tagsSorter: "alpha",
                operationsSorter: "alpha"
            }
        });

        const port = process.env["PORT"] ?? 3000;
        await app.listen(port);

        logger.log("═══════════════════════════════════════════════");
        logger.log(`  Aniverse API running on http://localhost:${port}/${globalPrefix}`);
        logger.log(`  Swagger UI: http://localhost:${port}/docs`);

        const pushMode =
            process.env["PUSH_MODE"] ?? (process.env["PUSH_ENABLED"] === "false" ? "disabled" : "embedded");
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
