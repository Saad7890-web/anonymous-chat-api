import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "../auth/auth.guard";
import type { AuthSession } from "../auth/types/auth-session.type";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { CreateRoomDto } from "./dto/create-room.dto";
import { RoomsService } from "./rooms.service";

@UseGuards(AuthGuard)
@Controller("rooms")
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  async listRooms() {
    return this.roomsService.listRooms();
  }

  @Post()
  async createRoom(
    @Body() dto: CreateRoomDto,
    @CurrentUser() user: AuthSession,
  ) {
    return this.roomsService.createRoom(dto, user);
  }

  @Get(":id")
  async getRoomById(@Param("id") id: string) {
    return this.roomsService.getRoomById(id);
  }

  @Delete(":id")
  async deleteRoom(@Param("id") id: string, @CurrentUser() user: AuthSession) {
    return this.roomsService.deleteRoom(id, user);
  }
}
