import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthSession } from "../auth/types/auth-session.type";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateMessageDto } from "./dto/create-message.dto";
import { MessagesService } from "./messages.service";

@UseGuards(AuthGuard)
@Controller("rooms/:id/messages")
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async listMessages(
    @Param("id") roomId: string,
    @Query("limit") limit?: string,
    @Query("before") before?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 50;
    return this.messagesService.listMessages(roomId, parsedLimit, before);
  }

  @Post()
  async sendMessage(
    @Param("id") roomId: string,
    @Body() dto: CreateMessageDto,
    @CurrentUser() user: AuthSession,
  ) {
    return this.messagesService.sendMessage(roomId, dto.content, user);
  }
}
