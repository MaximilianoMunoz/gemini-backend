import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class ImageGeneratorDto {
    @IsString()
    @IsNotEmpty()
    prompt: string;

    @IsArray()
    @IsOptional()
    files: Express.Multer.File[];

}
