import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { WeatherData, WeatherService } from "./weather.service";

@ApiTags("Weather")
@Controller("weather")
export class WeatherController {
    constructor(private readonly weatherService: WeatherService) {}

    @Get()
    getWeather(@Query("location") location: string): Promise<WeatherData | null> {
        return this.weatherService.getWeather(location);
    }
}
