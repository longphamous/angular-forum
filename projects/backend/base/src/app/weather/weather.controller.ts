import { Controller, Get, Query } from "@nestjs/common";

import { WeatherData, WeatherService } from "./weather.service";

@Controller("weather")
export class WeatherController {
    constructor(private readonly weatherService: WeatherService) {}

    @Get()
    getWeather(@Query("location") location: string): Promise<WeatherData | null> {
        return this.weatherService.getWeather(location);
    }
}
