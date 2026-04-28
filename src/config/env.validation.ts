import { plainToInstance } from "class-transformer";
import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  validateSync,
} from "class-validator";

class EnvironmentVariables {
  @IsOptional()
  @IsString()
  NODE_ENV?: string;

  @IsOptional()
  @IsNumberString()
  PORT?: string;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL!: string;

  @IsNotEmpty()
  @IsString()
  REDIS_URL!: string;

  @IsOptional()
  @IsString()
  JWT_SECRET?: string;

  @IsOptional()
  @IsNumberString()
  SESSION_TTL_SECONDS?: string;

  @IsOptional()
  @IsString()
  APP_PREFIX?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validated;
}
