import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user';
import type { AuthUser } from '../auth/current-user';

class AddItemDto {
  @IsString()
  kind!: string;

  @IsString()
  refId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  qty?: number;
}

class QtyDto {
  @IsInt()
  qty!: number;
}

@ApiTags('cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cart: CartService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.cart.getCart(user.userId);
  }

  @Post('items')
  add(@CurrentUser() user: AuthUser, @Body() dto: AddItemDto) {
    return this.cart.add(user.userId, dto.kind, dto.refId, dto.qty || 1);
  }

  @Patch('items/:id')
  patch(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: QtyDto) {
    return this.cart.patchQty(user.userId, id, dto.qty);
  }

  @Delete('items/:id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cart.remove(user.userId, id);
  }
}
