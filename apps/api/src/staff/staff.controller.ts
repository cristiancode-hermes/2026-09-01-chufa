import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { StaffService } from './staff.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, StaffGuard } from '../auth/current-user';
import type { AuthUser } from '../auth/current-user';

class StatusDto {
  @IsString()
  status!: string;
}

class ScanDto {
  @IsString()
  codeOrUrl!: string;
}

@ApiTags('staff')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, StaffGuard)
@Controller('staff')
export class StaffController {
  constructor(private readonly staff: StaffService) {}

  @Get('queue')
  queue() {
    return this.staff.queue();
  }

  @Patch('orders/:id/status')
  setStatus(@Param('id') id: string, @Body() dto: StatusDto) {
    return this.staff.setStatus(id, dto.status);
  }

  @Post('scan')
  scan(@CurrentUser() user: AuthUser, @Body() dto: ScanDto) {
    return this.staff.scan(user.userId, dto.codeOrUrl);
  }
}
