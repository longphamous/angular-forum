import { Controller, Get } from "@nestjs/common";

import { AppService } from "./app.service";
import { Public } from "./auth/auth.decorators";

@Public()
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    getData(): { message: string } {
        return this.appService.getData();
    }

    @Get("health")
    getHealth(): { status: string; timestamp: string } {
        return this.appService.getHealth();
    }
}
