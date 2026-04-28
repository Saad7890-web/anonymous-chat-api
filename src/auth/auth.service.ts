import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { SessionStore } from "./session.store";
import type { AuthSession } from "./types/auth-session.type";
import { UsersRepository } from "./users.repository";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly sessionStore: SessionStore,
  ) {}

  async login(username: string) {
    const existingUser = await this.usersRepository.findByUsername(username);

    const user = existingUser ?? (await this.createUserSafe(username));
    const sessionToken = this.generateSessionToken();

    await this.sessionStore.create(sessionToken, {
      userId: user.id,
      username: user.username,
    });

    return {
      sessionToken,
      user,
    };
  }

  async validateToken(token: string): Promise<AuthSession> {
    const session = await this.sessionStore.get(token);

    if (!session) {
      throw new UnauthorizedException({
        code: "UNAUTHORIZED",
        message: "Missing or expired session token",
      });
    }

    return session;
  }

  private async createUserSafe(username: string) {
    try {
      return await this.usersRepository.create(username);
    } catch (error: any) {
      if (error?.code === "23505") {
        const user = await this.usersRepository.findByUsername(username);
        if (user) return user;
      }

      throw new ConflictException({
        code: "USER_CREATE_FAILED",
        message: "Could not create user",
      });
    }
  }

  private generateSessionToken(): string {
    return randomBytes(32).toString("hex");
  }
}
