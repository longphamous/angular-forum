import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";
import { CalendarAttendeeEntity } from "./entities/calendar-attendee.entity";
import { CalendarEventEntity } from "./entities/calendar-event.entity";

@Module({
    imports: [TypeOrmModule.forFeature([CalendarEventEntity, CalendarAttendeeEntity])],
    controllers: [CalendarController],
    providers: [CalendarService],
    exports: [CalendarService]
})
export class CalendarModule {}
