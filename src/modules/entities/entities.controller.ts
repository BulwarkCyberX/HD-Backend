import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { CreateEntityDto } from './dto/create-entity.dto';
import { EntitiesService } from './entities.service';

@Controller('entities')
@UseGuards(JwtAuthGuard)
export class EntitiesController {
  constructor(private readonly entities: EntitiesService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateEntityDto) {
    return this.entities.createForUser({ userId: user.userId, type: dto.type, name: dto.name });
  }
}

