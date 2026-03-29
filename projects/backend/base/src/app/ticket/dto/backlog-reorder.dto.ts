import { IsArray, IsNotEmpty, IsUUID } from "class-validator";

export class BacklogReorderDto {
    @IsArray()
    @IsUUID("4", { each: true })
    @IsNotEmpty()
    ticketIds!: string[];
}
