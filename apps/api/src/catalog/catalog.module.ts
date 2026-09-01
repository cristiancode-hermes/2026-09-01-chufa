import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Addon, Size } from '../entities/entities';
import { AuthModule } from '../auth/auth.module';
import { CatalogController } from './catalog.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Size, Addon]), AuthModule],
  controllers: [CatalogController],
})
export class CatalogModule {}
