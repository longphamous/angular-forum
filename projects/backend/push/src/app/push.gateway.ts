import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer
} from "@nestjs/websockets";
import * as jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";

import { AuthenticatedUser, JWT_SECRET, JwtPayload } from "../contracts";

@WebSocketGateway({
    namespace: "/push",
    cors: { origin: "*", credentials: true },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 20000
})
export class PushGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(PushGateway.name);

    readonly userSockets = new Map<string, Set<string>>();

    @WebSocketServer()
    server!: Server;

    constructor(private readonly configService: ConfigService) {}

    afterInit(server: Server): void {
        const secret = this.configService.get<string>("JWT_SECRET") ?? JWT_SECRET;

        server.use((socket: Socket, next) => {
            const token =
                (socket.handshake.auth as { token?: string }).token ??
                socket.handshake.headers.authorization?.replace("Bearer ", "");

            if (!token) {
                this.logger.warn(`Connection rejected: no token (IP: ${socket.handshake.address})`);
                return next(new Error("Authentication required"));
            }

            try {
                const payload = jwt.verify(token, secret) as JwtPayload;
                socket.data.user = {
                    userId: payload.sub,
                    username: payload.username,
                    role: payload.role
                } satisfies AuthenticatedUser;
                next();
            } catch (err) {
                this.logger.warn(`Auth failed: ${(err as Error).message} (IP: ${socket.handshake.address})`);
                next(new Error("Invalid or expired token"));
            }
        });

        this.logger.log("Push gateway initialized — awaiting connections");
    }

    handleConnection(client: Socket): void {
        const user = client.data.user as AuthenticatedUser | undefined;
        if (!user) {
            client.disconnect(true);
            return;
        }

        let sockets = this.userSockets.get(user.userId);
        if (!sockets) {
            sockets = new Set();
            this.userSockets.set(user.userId, sockets);
        }
        const wasOffline = sockets.size === 0;
        sockets.add(client.id);

        void client.join(`user:${user.userId}`);

        if (wasOffline) {
            this.server.emit("presence:userOnline", { userId: user.userId });
            this.logger.log(`User online: ${user.username} (${this.userSockets.size} total)`);
        }

        client.on("error", (err) => {
            this.logger.warn(`Socket error for ${user.username}: ${err.message}`);
        });
    }

    handleDisconnect(client: Socket): void {
        const user = client.data.user as AuthenticatedUser | undefined;
        if (!user) return;

        const sockets = this.userSockets.get(user.userId);
        if (sockets) {
            sockets.delete(client.id);
            if (sockets.size === 0) {
                this.userSockets.delete(user.userId);
                this.server.emit("presence:userOffline", { userId: user.userId });
                this.logger.log(`User offline: ${user.username} (${this.userSockets.size} total)`);
            }
        }
    }

    @SubscribeMessage("thread:join")
    handleJoinThread(client: Socket, threadId: string): void {
        if (threadId) void client.join(`thread:${threadId}`);
    }

    @SubscribeMessage("thread:leave")
    handleLeaveThread(client: Socket, threadId: string): void {
        if (threadId) void client.leave(`thread:${threadId}`);
    }

    @SubscribeMessage("conversation:join")
    handleJoinConversation(client: Socket, conversationId: string): void {
        if (conversationId) void client.join(`conversation:${conversationId}`);
    }

    @SubscribeMessage("conversation:leave")
    handleLeaveConversation(client: Socket, conversationId: string): void {
        if (conversationId) void client.leave(`conversation:${conversationId}`);
    }

    @SubscribeMessage("message:typing")
    handleTyping(client: Socket, conversationId: string): void {
        if (!conversationId) return;
        const user = client.data.user as AuthenticatedUser;
        client.to(`conversation:${conversationId}`).emit("message:typing", {
            conversationId,
            userId: user.userId,
            username: user.username
        });
    }
}
