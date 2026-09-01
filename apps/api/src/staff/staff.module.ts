import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailLog, MillDay, Order, ScanEvent, User } from '../entities/entities';
import { AuthModule } from '../auth/auth.module';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Order, MillDay, ScanEvent, User, EmailLog]), AuthModule],
  providers: [StaffService],
  controllers: [StaffController],
  exports: [StaffService],
})
export class StaffModule {}
