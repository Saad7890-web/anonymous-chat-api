import { Transform } from "class-transformer";
import { IsString } from "class-validator";

export class CreateMessageDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  content!: string;
}
