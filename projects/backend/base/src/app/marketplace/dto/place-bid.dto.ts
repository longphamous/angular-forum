import { IsNumber, IsOptional, Min } from "class-validator";

export class PlaceBidDto {
    @IsNumber()
    @Min(0.01)
    amount!: number;

    @IsOptional()
    @IsNumber()
    @Min(0.01)
    maxAutoBid?: number;
}
