import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";

import { DATABASE_CONFIG_KEY, databaseConfig } from "./database.config";

/**
 * DatabaseModule – registers the global TypeORM connection.
 *
 * Import this once in AppModule. Individual feature modules register their
 * entities via TypeOrmModule.forFeature([Entity]) inside their own module.
 */
@Module({
    imports: [
        ConfigModule.forFeature(databaseConfig),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService): TypeOrmModuleOptions =>
                config.get<TypeOrmModuleOptions>(DATABASE_CONFIG_KEY) as TypeOrmModuleOptions
        })
    ]
})
export class DatabaseModule {}
