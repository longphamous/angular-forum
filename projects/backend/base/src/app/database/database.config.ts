import { registerAs } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

export const DATABASE_CONFIG_KEY = "database";

export const databaseConfig = registerAs(
    DATABASE_CONFIG_KEY,
    (): TypeOrmModuleOptions => ({
        type: "postgres",
        host: process.env["DB_HOST"] ?? "localhost",
        port: Number(process.env["DB_PORT"] ?? 5432),
        username: process.env["DB_USER"] ?? "aniverse_app",
        password: process.env["DB_PASSWORD"] ?? "CHANGE_ME",
        database: process.env["DB_NAME"] ?? "aniverse_base",
        schema: process.env["DB_SCHEMA"] ?? "public",
        // Entities are registered per-module via forFeature()
        entities: [],
        // Set to false in production – use migrations instead
        synchronize: process.env["NODE_ENV"] !== "production",
        logging: process.env["NODE_ENV"] === "development",
        ssl: process.env["DB_SSL"] === "true" ? { rejectUnauthorized: false } : false
    })
);
