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

import { JWT_SECRET } from "../auth/auth.constants";
import { AuthenticatedUser, JwtPayload } from "../auth/models/jwt.model";

/**
 * WebSocket gateway for real-time push events.
 *
 * Uses Socket.IO with JWT-based handshake authentication.
 * Clients connect to the `/push` namespace and are auto-joined
 * to their personal `user:<userId>` room.
 */
@WebSocketGateway({
    namespace: "/push",
    cors: { origin: "*", credentials: true },
    transports: ["websocket", "polling"]
})
export class PushGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(PushGateway.name);

    /** Map of userId → Set of connected socket IDs (multi-tab support). */
    readonly userSockets = new Map<string, Set<string>>();

    @WebSocketServer()
    server!: Server;

    constructor(private readonly configService: ConfigService) {}

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    afterInit(server: Server): void {
        const secret = this.configService.get<string>("JWT_SECRET") ?? JWT_SECRET;

        server.use((socket: Socket, next) => {
            const token =
                (socket.handshake.auth as { token?: string }).token ??
                socket.handshake.headers.authorization?.replace("Bearer ", "");

            if (!token) {
                return next(new Error("Authentication required"));
            }

            try {
                const payload = jwt.verify(token, secret) as JwtPayload;
                const user: AuthenticatedUser = {
                    userId: payload.sub,
                    username: payload.username,
                    role: payload.role
                };
                socket.data.user = user;
                next();
            } catch {
                next(new Error("Invalid or expired token"));
            }
        });

        this.logger.log("Push gateway initialized");
    }

    handleConnection(client: Socket): void {
        const user = client.data.user as AuthenticatedUser | undefined;
        if (!user) {
            client.disconnect(true);
            return;
        }

        // Track socket
        let sockets = this.userSockets.get(user.userId);
        if (!sockets) {
            sockets = new Set();
            this.userSockets.set(user.userId, sockets);
        }
        const wasOffline = sockets.size === 0;
        sockets.add(client.id);

        // Join personal room
        void client.join(`user:${user.userId}`);

        // Broadcast online status if user just came online
        if (wasOffline) {
            this.server.emit("presence:userOnline", { userId: user.userId });
        }

        this.logger.debug(`Client connected: ${user.username} (${client.id}) [${sockets.size} tab(s)]`);
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
            }
        }

        this.logger.debug(`Client disconnected: ${user.username} (${client.id})`);
    }

    // ─── Client-initiated subscriptions ───────────────────────────────────────

    @SubscribeMessage("thread:join")
    handleJoinThread(client: Socket, threadId: string): void {
        void client.join(`thread:${threadId}`);
    }

    @SubscribeMessage("thread:leave")
    handleLeaveThread(client: Socket, threadId: string): void {
        void client.leave(`thread:${threadId}`);
    }
    @SubscribeMessage("conversation:join")
    handleJoinConversation(client: Socket, conversationId: string): void {
        void client.join(`conversation:${conversationId}`);
    }

    @SubscribeMessage("conversation:leave")
    handleLeaveConversation(client: Socket, conversationId: string): void {
        void client.leave(`conversation:${conversationId}`);
    }

    @SubscribeMessage("message:typing")
    handleTyping(client: Socket, conversationId: string): void {
        const user = client.data.user as AuthenticatedUser;
        client.to(`conversation:${conversationId}`).emit("message:typing", {
            conversationId,
            userId: user.userId,
            username: user.username
        } satisfies { conversationId: string; userId: string; username: string });
    }
}
