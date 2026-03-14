import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { join } from "path";

import { AppModule } from "./app/app.module";

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.useStaticAssets(join(process.cwd(), "uploads"), { prefix: "/uploads" });

    const globalPrefix = "api";
    app.setGlobalPrefix(globalPrefix);

    const port = process.env["PORT"] ?? 3000;
    await app.listen(port);

    console.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
