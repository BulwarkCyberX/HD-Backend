import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser, type RequestUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  @Roles(UserRole.CLIENT)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateReviewDto) {
    return this.reviews.create({
      requesterId: user.userId,
      role: user.role,
      projectId: dto.projectId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }

  @Post('client')
  @Roles(UserRole.PROVIDER)
  createClientReview(@CurrentUser() user: RequestUser, @Body() dto: CreateReviewDto) {
    return this.reviews.createClientReview({
      requesterId: user.userId,
      role: user.role,
      projectId: dto.projectId,
      rating: dto.rating,
      comment: dto.comment,
    });
  }
}
