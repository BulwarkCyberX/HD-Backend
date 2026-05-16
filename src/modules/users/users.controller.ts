import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  me(@CurrentUser() user: RequestUser) {
    return this.users.getMe(user.userId);
  }

  @Patch('me/provider-profile')
  @ApiOperation({ summary: 'Update provider bio, portfolio, skills, availability' })
  updateProviderProfile(@CurrentUser() user: RequestUser, @Body() dto: UpdateProviderProfileDto) {
    return this.users.updateProviderProfile(user.userId, user.role, dto);
  }

  @Patch('me/settings')
  @ApiOperation({ summary: 'Notification preferences' })
  updateSettings(@CurrentUser() user: RequestUser, @Body() dto: UpdateUserSettingsDto) {
    return this.users.updateSettings(user.userId, dto);
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

