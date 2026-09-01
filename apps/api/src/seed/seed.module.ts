import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Addon,
  EmailLog,
  MillDay,
  Order,
  OrderLine,
  Review,
  Size,
  User,
} from '../entities/entities';
import { SeedService } from './seed.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, MillDay, Size, Addon, Order, OrderLine, Review, EmailLog]),
  ],
  providers: [SeedService],
})
export class SeedModule {}
