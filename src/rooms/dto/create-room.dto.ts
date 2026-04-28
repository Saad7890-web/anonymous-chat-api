import { Transform } from "class-transformer";
import { Matches } from "class-validator";

export class CreateRoomDto {
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @Matches(/^[A-Za-z0-9-]{3,32}$/, {
    message:
      "name must be between 3 and 32 characters and contain only alphanumeric characters and hyphens",
  })
  name!: string;
}
