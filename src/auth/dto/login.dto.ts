import { Matches } from "class-validator";

export class LoginDto {
  @Matches(/^[A-Za-z0-9_]{2,24}$/, {
    message:
      "username must be between 2 and 24 characters and contain only alphanumeric characters and underscores",
  })
  username!: string;
}
