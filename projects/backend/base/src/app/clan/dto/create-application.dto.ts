import { IsOptional, IsString } from "class-validator";

export class CreateApplicationDto {
    @IsString()
    @IsOptional()
    message?: string;
}
