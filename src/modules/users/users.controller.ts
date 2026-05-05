import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.users.getMe(user.userId);
  }

  @Get('provider/:id')
  providerProfile(@Param('id') id: string) {
    return this.users.getProviderProfile(id);
  }

  @Get(':id')
  byId(@CurrentUser() requester: RequestUser, @Param('id') id: string) {
    return this.users.getById(requester, id);
  }
}

