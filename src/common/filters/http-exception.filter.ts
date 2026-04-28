import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

type ErrorResponseBody = {
  code?: string;
  message?: string | string[];
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let payload: ErrorResponseBody = {};

      if (typeof exceptionResponse === "string") {
        payload = { message: exceptionResponse };
      } else if (exceptionResponse && typeof exceptionResponse === "object") {
        payload = exceptionResponse as ErrorResponseBody;
      }

      const code = payload.code ?? this.defaultCodeForStatus(status);

      const message = Array.isArray(payload.message)
        ? payload.message[0]
        : (payload.message ?? exception.message);

      response.status(status).json({
        success: false,
        error: {
          code,
          message,
        },
      });

      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Something went wrong",
      },
    });
  }

  private defaultCodeForStatus(status: number): string {
    switch (status) {
      case 400:
        return "VALIDATION_ERROR";
      case 401:
        return "UNAUTHORIZED";
      case 403:
        return "FORBIDDEN";
      case 404:
        return "NOT_FOUND";
      case 409:
        return "CONFLICT";
      case 422:
        return "UNPROCESSABLE_ENTITY";
      default:
        return "HTTP_ERROR";
    }
  }
}
