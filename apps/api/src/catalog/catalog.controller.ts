import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';
import { Repository } from 'typeorm';
import { Addon, Size } from '../entities/entities';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/current-user';

class StockDto {
  @IsInt()
  @Min(0)
  stock!: number;
}

@ApiTags('catalog')
@Controller()
export class CatalogController {
  constructor(
    @InjectRepository(Size) private readonly sizes: Repository<Size>,
    @InjectRepository(Addon) private readonly addons: Repository<Addon>,
  ) {}

  @Get('sizes')
  async listSizes() {
    const items = await this.sizes.find({ where: { active: true }, order: { priceCents: 'ASC' } });
    const fromPriceCents = items.length ? Math.min(...items.map((s) => s.priceCents)) : 0;
    return { items, fromPriceCents };
  }

  @Get('sizes/:slug')
  async oneSize(@Param('slug') slug: string) {
    const size = await this.sizes.findOne({ where: { slug } });
    if (!size) return null;
    return size;
  }

  @Get('addons')
  listAddons() {
    return this.addons.find({ order: { priceCents: 'ASC' } });
  }

  @Patch('admin/addons/:id/stock')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, AdminGuard)
  async patchStock(@Param('id') id: string, @Body() dto: StockDto) {
    const addon = await this.addons.findOne({ where: { id } });
    if (!addon) return null;
    addon.stock = dto.stock;
    return this.addons.save(addon);
  }
}
