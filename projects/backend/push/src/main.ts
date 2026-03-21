import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";

import { PushAppModule } from "./app/push.module";

async function bootstrap(): Promise<void> {
    const logger = new Logger("PushServer");

    try {
        const app = await NestFactory.create<NestExpressApplication>(PushAppModule, {
            logger: ["error", "warn", "log", "debug"]
        });

        app.enableCors({ origin: true, credentials: true });
        app.enableShutdownHooks();
        app.setGlobalPrefix("api");

        const port = process.env["PUSH_PORT"] ?? 3001;
        await app.listen(port);

        logger.log("═══════════════════════════════════════════════");
        logger.log(`  Push server running on http://localhost:${port}`);
        logger.log(`  WebSocket gateway on ws://localhost:${port}/push`);
        logger.log(`  Health: http://localhost:${port}/api/push/health`);
        logger.log("═══════════════════════════════════════════════");
    } catch (err) {
        logger.error("Failed to start push server", (err as Error).stack);
        process.exit(1);
    }
}

process.on("unhandledRejection", (reason) => {
    new Logger("UnhandledRejection").error(`${reason}`);
});

process.on("uncaughtException", (err) => {
    new Logger("UncaughtException").error(err.message, err.stack);
    process.exit(1);
});

bootstrap();
