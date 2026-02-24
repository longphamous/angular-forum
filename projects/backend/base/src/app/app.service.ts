import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
    getData(): { message: string } {
        return { message: "Welcome to Aniverse Base API!" };
    }

    getHealth(): { status: string; timestamp: string } {
        return {
            status: "ok",
            timestamp: new Date().toISOString()
        };
    }
}
