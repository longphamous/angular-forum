import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash } from "crypto";
import * as fs from "fs/promises";
import * as path from "path";
import { Repository } from "typeorm";

import { FtpConfig, S3Config, StorageBackendType, StorageConfigEntity } from "./entities/storage-config.entity";

export interface StorageResult {
    storagePath: string;
    publicUrl: string;
    storageBackend: StorageBackendType;
}

@Injectable()
export class MediaStorageService implements OnModuleInit {
    private readonly logger = new Logger(MediaStorageService.name);
    private config: StorageConfigEntity | null = null;

    constructor(
        @InjectRepository(StorageConfigEntity)
        private readonly configRepo: Repository<StorageConfigEntity>
    ) {}

    async onModuleInit(): Promise<void> {
        await this.loadConfig();
    }

    async loadConfig(): Promise<StorageConfigEntity> {
        let config = await this.configRepo.findOne({ where: { id: "default" } });
        if (!config) {
            config = this.configRepo.create({ id: "default" });
            config = await this.configRepo.save(config);
        }
        this.config = config;
        this.logger.log(`Media storage backend: ${this.config.activeBackend}`);
        return this.config;
    }

    getConfig(): StorageConfigEntity {
        if (!this.config) throw new Error("Storage config not loaded");
        return this.config;
    }

    getActiveBackend(): StorageBackendType {
        return this.config?.activeBackend ?? "local";
    }

    // ── Core operations ──────────────────────────────────────────

    async put(relativePath: string, buffer: Buffer): Promise<StorageResult> {
        const backend = this.getActiveBackend();
        switch (backend) {
            case "ftp":
                return this.putFtp(relativePath, buffer);
            case "s3":
                return this.putS3(relativePath, buffer);
            default:
                return this.putLocal(relativePath, buffer);
        }
    }

    async get(relativePath: string): Promise<Buffer> {
        const backend = this.getActiveBackend();
        switch (backend) {
            case "ftp":
                return this.getFtp(relativePath);
            case "s3":
                return this.getS3(relativePath);
            default:
                return this.getLocal(relativePath);
        }
    }

    async delete(relativePath: string): Promise<void> {
        const backend = this.getActiveBackend();
        switch (backend) {
            case "ftp":
                await this.deleteFtp(relativePath);
                break;
            case "s3":
                await this.deleteS3(relativePath);
                break;
            default:
                await this.deleteLocal(relativePath);
        }
    }

    async exists(relativePath: string): Promise<boolean> {
        const backend = this.getActiveBackend();
        switch (backend) {
            case "ftp":
                return this.ftpExists(relativePath);
            case "s3":
                return this.s3Exists(relativePath);
            default:
                return this.localExists(relativePath);
        }
    }

    // ── URL helpers ──────────────────────────────────────────────

    getPublicUrl(relativePath: string): string {
        const config = this.getConfig();
        const normalizedPath = relativePath.replace(/\\/g, "/");
        switch (config.activeBackend) {
            case "ftp":
                return `${config.ftpConfig?.publicUrlPrefix ?? ""}/${normalizedPath}`;
            case "s3":
                return `${config.s3Config?.publicUrlPrefix ?? ""}/${normalizedPath}`;
            default:
                return `${config.localPublicUrlPrefix}/${normalizedPath}`;
        }
    }

    computeChecksum(buffer: Buffer): string {
        return createHash("sha256").update(buffer).digest("hex");
    }

    buildRelativePath(ownerId: string, filename: string): string {
        const now = new Date();
        const year = now.getFullYear().toString();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        return path.posix.join(ownerId, year, month, safeFilename);
    }

    // ── Config management ────────────────────────────────────────

    async updateConfig(patch: Partial<Omit<StorageConfigEntity, "id" | "updatedAt">>): Promise<StorageConfigEntity> {
        const config = await this.loadConfig();
        Object.assign(config, patch);
        const saved = await this.configRepo.save(config);
        this.config = saved;
        return saved;
    }

    async testConnection(backend: StorageBackendType): Promise<{ success: boolean; message: string }> {
        try {
            switch (backend) {
                case "ftp":
                    return await this.testFtpConnection();
                case "s3":
                    return await this.testS3Connection();
                default:
                    return { success: true, message: "Local storage is always available" };
            }
        } catch (err) {
            return { success: false, message: String(err) };
        }
    }

    // ── Local storage ────────────────────────────────────────────

    private getLocalBasePath(): string {
        return path.join(process.cwd(), this.config?.localBasePath ?? "uploads/media");
    }

    private async putLocal(relativePath: string, buffer: Buffer): Promise<StorageResult> {
        const fullPath = path.join(this.getLocalBasePath(), relativePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, buffer);
        return {
            storagePath: relativePath,
            publicUrl: this.getPublicUrl(relativePath),
            storageBackend: "local"
        };
    }

    private async getLocal(relativePath: string): Promise<Buffer> {
        return fs.readFile(path.join(this.getLocalBasePath(), relativePath));
    }

    private async deleteLocal(relativePath: string): Promise<void> {
        try {
            await fs.unlink(path.join(this.getLocalBasePath(), relativePath));
        } catch (err) {
            this.logger.warn(`Failed to delete local file: ${relativePath}`, err);
        }
    }

    private async localExists(relativePath: string): Promise<boolean> {
        try {
            await fs.access(path.join(this.getLocalBasePath(), relativePath));
            return true;
        } catch {
            return false;
        }
    }

    // ── FTP storage (requires basic-ftp) ─────────────────────────

    private getFtpConfig(): FtpConfig {
        const config = this.getConfig().ftpConfig;
        if (!config) throw new Error("FTP not configured");
        return config;
    }

    private async putFtp(relativePath: string, buffer: Buffer): Promise<StorageResult> {
        const ftp = this.getFtpConfig();
        try {
            const { Client } = require("basic-ftp");
            const client = new Client();
            await client.access({ host: ftp.host, port: ftp.port, user: ftp.username, password: ftp.password, secure: ftp.secure });
            const remotePath = path.posix.join(ftp.basePath, relativePath);
            const remoteDir = path.posix.dirname(remotePath);
            await client.ensureDir(remoteDir);
            const { Readable } = require("stream");
            await client.uploadFrom(Readable.from(buffer), remotePath);
            client.close();
        } catch (err) {
            this.logger.error("FTP upload failed – install basic-ftp for FTP support", err);
            return this.putLocal(relativePath, buffer);
        }
        return { storagePath: relativePath, publicUrl: this.getPublicUrl(relativePath), storageBackend: "ftp" };
    }

    private async getFtp(relativePath: string): Promise<Buffer> {
        const ftp = this.getFtpConfig();
        try {
            const { Client } = require("basic-ftp");
            const { Writable } = require("stream");
            const client = new Client();
            await client.access({ host: ftp.host, port: ftp.port, user: ftp.username, password: ftp.password, secure: ftp.secure });
            const remotePath = path.posix.join(ftp.basePath, relativePath);
            const chunks: Buffer[] = [];
            const writable = new Writable({
                write(chunk: Buffer, _enc: BufferEncoding, cb: () => void): void {
                    chunks.push(Buffer.from(chunk));
                    cb();
                }
            });
            await client.downloadTo(writable, remotePath);
            client.close();
            return Buffer.concat(chunks);
        } catch {
            return this.getLocal(relativePath);
        }
    }

    private async deleteFtp(relativePath: string): Promise<void> {
        const ftp = this.getConfig().ftpConfig;
        if (!ftp) return;
        try {
            const { Client } = require("basic-ftp");
            const client = new Client();
            await client.access({ host: ftp.host, port: ftp.port, user: ftp.username, password: ftp.password, secure: ftp.secure });
            await client.remove(path.posix.join(ftp.basePath, relativePath));
            client.close();
        } catch (err) {
            this.logger.warn("FTP delete failed", err);
        }
    }

    private async ftpExists(relativePath: string): Promise<boolean> {
        const ftp = this.getConfig().ftpConfig;
        if (!ftp) return false;
        try {
            const { Client } = require("basic-ftp");
            const client = new Client();
            await client.access({ host: ftp.host, port: ftp.port, user: ftp.username, password: ftp.password, secure: ftp.secure });
            const remotePath = path.posix.join(ftp.basePath, relativePath);
            const size = await client.size(remotePath);
            client.close();
            return size >= 0;
        } catch {
            return false;
        }
    }

    private async testFtpConnection(): Promise<{ success: boolean; message: string }> {
        const config = this.getConfig().ftpConfig;
        if (!config) return { success: false, message: "FTP not configured" };
        try {
            const { Client } = require("basic-ftp");
            const client = new Client();
            await client.access({ host: config.host, port: config.port, user: config.username, password: config.password, secure: config.secure });
            await client.close();
            return { success: true, message: `Connected to ${config.host}:${config.port}` };
        } catch (err) {
            return { success: false, message: `FTP connection failed: ${String(err)}` };
        }
    }

    // ── S3 storage (requires @aws-sdk/client-s3) ─────────────────

    private getS3Config(): S3Config {
        const config = this.getConfig().s3Config;
        if (!config) throw new Error("S3 not configured");
        return config;
    }

    private async putS3(relativePath: string, buffer: Buffer): Promise<StorageResult> {
        const s3 = this.getS3Config();
        try {
            const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
            const client = new S3Client({
                region: s3.region,
                ...(s3.endpoint ? { endpoint: s3.endpoint, forcePathStyle: s3.forcePathStyle } : {}),
                credentials: { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey }
            });
            await client.send(new PutObjectCommand({ Bucket: s3.bucket, Key: relativePath, Body: buffer }));
        } catch (err) {
            this.logger.error("S3 upload failed – install @aws-sdk/client-s3 for S3 support", err);
            return this.putLocal(relativePath, buffer);
        }
        return { storagePath: relativePath, publicUrl: this.getPublicUrl(relativePath), storageBackend: "s3" };
    }

    private async getS3(relativePath: string): Promise<Buffer> {
        const s3 = this.getS3Config();
        try {
            const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
            const client = new S3Client({
                region: s3.region,
                ...(s3.endpoint ? { endpoint: s3.endpoint, forcePathStyle: s3.forcePathStyle } : {}),
                credentials: { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey }
            });
            const result = await client.send(new GetObjectCommand({ Bucket: s3.bucket, Key: relativePath }));
            const stream = result.Body as NodeJS.ReadableStream;
            const chunks: Buffer[] = [];
            for await (const chunk of stream) chunks.push(Buffer.from(chunk as Uint8Array));
            return Buffer.concat(chunks);
        } catch {
            return this.getLocal(relativePath);
        }
    }

    private async deleteS3(relativePath: string): Promise<void> {
        const s3 = this.getConfig().s3Config;
        if (!s3) return;
        try {
            const { S3Client, DeleteObjectCommand } = require("@aws-sdk/client-s3");
            const client = new S3Client({
                region: s3.region,
                ...(s3.endpoint ? { endpoint: s3.endpoint, forcePathStyle: s3.forcePathStyle } : {}),
                credentials: { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey }
            });
            await client.send(new DeleteObjectCommand({ Bucket: s3.bucket, Key: relativePath }));
        } catch (err) {
            this.logger.warn("S3 delete failed", err);
        }
    }

    private async s3Exists(relativePath: string): Promise<boolean> {
        const s3 = this.getConfig().s3Config;
        if (!s3) return false;
        try {
            const { S3Client, HeadObjectCommand } = require("@aws-sdk/client-s3");
            const client = new S3Client({
                region: s3.region,
                ...(s3.endpoint ? { endpoint: s3.endpoint, forcePathStyle: s3.forcePathStyle } : {}),
                credentials: { accessKeyId: s3.accessKeyId, secretAccessKey: s3.secretAccessKey }
            });
            await client.send(new HeadObjectCommand({ Bucket: s3.bucket, Key: relativePath }));
            return true;
        } catch {
            return false;
        }
    }

    private async testS3Connection(): Promise<{ success: boolean; message: string }> {
        const config = this.getConfig().s3Config;
        if (!config) return { success: false, message: "S3 not configured" };
        try {
            const { S3Client, HeadBucketCommand } = require("@aws-sdk/client-s3");
            const client = new S3Client({
                endpoint: config.endpoint || undefined,
                region: config.region,
                credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
                forcePathStyle: config.forcePathStyle
            });
            await client.send(new HeadBucketCommand({ Bucket: config.bucket }));
            return { success: true, message: `Connected to bucket "${config.bucket}"` };
        } catch (err) {
            return { success: false, message: `S3 connection failed: ${String(err)}` };
        }
    }
}
