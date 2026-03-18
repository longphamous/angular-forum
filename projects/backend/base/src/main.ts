import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

import { AppModule } from "./app/app.module";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.enableCors({ origin: true, credentials: true });
    app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });

    // Graceful shutdown — release port on SIGINT/SIGTERM
    app.enableShutdownHooks();

    const globalPrefix = "api";
    app.setGlobalPrefix(globalPrefix);

    const port = process.env["PORT"] ?? 3000;
    await app.listen(port);

    const logger = new Logger("Bootstrap");
    logger.log(`Application is running on: http://localhost:${port}/${globalPrefix}`);

    const pushEnabled = process.env["PUSH_ENABLED"] !== "false";
    if (pushEnabled) {
        logger.log(`Push WebSocket gateway active on ws://localhost:${port}/push`);
    } else {
        logger.log("Push WebSocket gateway is DISABLED (PUSH_ENABLED=false)");
    }
}

bootstrap();
