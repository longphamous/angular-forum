import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches } from "class-validator";

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    @Length(3, 30)
    @Matches(/^[a-zA-Z0-9_-]+$/, { message: "Username may only contain letters, numbers, hyphens and underscores" })
    username!: string;

    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @IsString()
    @IsNotEmpty()
    @Length(8, 128)
    password!: string;

    @IsOptional()
    @IsString()
    @Length(1, 50)
    displayName?: string;
}
