import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailLog, MillDay, Order, Review } from '../entities/entities';
import { AuthModule } from '../auth/auth.module';
import { MillService } from './mill.service';
import { MillController } from './mill.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MillDay, Review, Order, EmailLog]), AuthModule],
  providers: [MillService],
  controllers: [MillController],
  exports: [MillService],
})
export class MillModule {}
