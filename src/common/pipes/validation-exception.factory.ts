import { BadRequestException, ValidationError } from "@nestjs/common";

export function validationExceptionFactory(
  errors: ValidationError[],
): BadRequestException {
  const messages = errors.flatMap((error) =>
    Object.values(error.constraints ?? {}),
  );

  return new BadRequestException({
    code: "VALIDATION_ERROR",
    message: messages[0] ?? "Validation failed",
  });
}
