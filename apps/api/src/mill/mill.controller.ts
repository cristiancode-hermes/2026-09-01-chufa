import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { MillService } from './mill.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard, CurrentUser } from '../auth/current-user';
import type { AuthUser } from '../auth/current-user';

class ReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  body?: string;
}

class PatchMillDto {
  @IsOptional()
  kgSoaked?: number;

  @IsOptional()
  @IsInt()
  litersYield?: number;

  @IsOptional()
  @IsInt()
  litersRemaining?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

@ApiTags('mill')
@Controller()
export class MillController {
  constructor(private readonly mill: MillService) {}

  @Get('mill/today')
  today() {
    return this.mill.today();
  }

  @Get('mill/:id/reviews')
  reviews(@Param('id') id: string) {
    return this.mill.listReviews(id);
  }

  @Post('mill/:id/reviews')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  addReview(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ReviewDto) {
    return this.mill.addReview(user.userId, id, dto.rating, dto.body);
  }

  @Get('mill/:id')
  getOne(@Param('id') id: string) {
    return this.mill.getOne(id);
  }

  @Get('account/inbox')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  inbox(@CurrentUser() user: AuthUser) {
    return this.mill.inbox(user.userId);
  }

  @Patch('admin/mill/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  patch(@Param('id') id: string, @Body() dto: PatchMillDto) {
    return this.mill.patchMill(id, dto);
  }

  @Get('admin/stats')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  stats() {
    return this.mill.stats14d();
  }
}
