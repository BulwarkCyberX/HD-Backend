import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateMessageDto) {
    return this.messages.create({
      projectId: dto.projectId,
      senderId: user.userId,
      message: dto.message,
    });
  }

  @Get(':projectId')
  listByProject(@CurrentUser() user: RequestUser, @Param('projectId') projectId: string) {
    return this.messages.listByProject({ projectId, requesterId: user.userId });
  }
}
