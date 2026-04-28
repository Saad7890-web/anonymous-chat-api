import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { RequestWithUser } from "../common/types/request-with-user.type";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers.authorization;

    if (!authorization || Array.isArray(authorization)) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Missing or expired session token",
      });
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Missing or expired session token",
      });
    }

    const session = await this.authService.validateToken(token.trim());
    request.user = session;

    return true;
  }
}
