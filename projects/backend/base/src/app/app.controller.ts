import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { AppService } from "./app.service";
import { Public } from "./auth/auth.decorators";

@ApiTags("System")
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
