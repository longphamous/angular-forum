import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Observable } from "rxjs";
import { Repository } from "typeorm";

import { UserEntity } from "./entities/user.entity";

/** Updates last_seen_at for every authenticated request, throttled to once per minute per user. */
@Injectable()
export class PresenceInterceptor implements NestInterceptor {
    /** In-memory throttle: userId → timestamp of last DB write */
    private readonly throttle = new Map<string, number>();
    private readonly THROTTLE_MS = 60_000;

    constructor(
        @InjectRepository(UserEntity)
        private readonly userRepo: Repository<UserEntity>
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
        const req = context.switchToHttp().getRequest<{ user?: { userId: string } }>();
        const userId = req.user?.userId;

        if (userId) {
            const now = Date.now();
            if (now - (this.throttle.get(userId) ?? 0) > this.THROTTLE_MS) {
                this.throttle.set(userId, now);
                this.userRepo.update(userId, { lastSeenAt: new Date() }).catch((_err: unknown) => undefined);
            }
        }

        return next.handle();
    }
}
