import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Addon, CartItem, Size } from '../entities/entities';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem) private readonly items: Repository<CartItem>,
    @InjectRepository(Size) private readonly sizes: Repository<Size>,
    @InjectRepository(Addon) private readonly addons: Repository<Addon>,
  ) {}

  async getCart(userId: string) {
    const rows = await this.items.find({
      where: { userId },
      relations: { size: true, addon: true },
    });
    const mapped = rows.map((r) => {
      const name = r.kind === 'size' ? r.size?.name : r.addon?.name;
      const unit = r.kind === 'size' ? r.size?.priceCents || 0 : r.addon?.priceCents || 0;
      const ml = r.kind === 'size' ? (r.size?.ml || 0) * r.qty : 0;
      const photo = r.kind === 'size' ? r.size?.photoUrl : r.addon?.photoUrl;
      const stock = r.kind === 'addon' ? r.addon?.stock ?? 0 : null;
      return {
        id: r.id,
        kind: r.kind,
        refId: r.kind === 'size' ? r.sizeId : r.addonId,
        name: name || '',
        qty: r.qty,
        unitPriceCents: unit,
        lineTotalCents: unit * r.qty,
        ml,
        photoUrl: photo || null,
        stock,
      };
    });
    const liveTotalCents = mapped.reduce((s, i) => s + i.lineTotalCents, 0);
    const liveMl = mapped.reduce((s, i) => s + i.ml, 0);
    return { items: mapped, liveTotalCents, liveMl };
  }

  async add(userId: string, kind: string, refId: string, qty: number) {
    const q = Math.max(1, qty || 1);
    if (kind === 'size') {
      const size = await this.sizes.findOne({ where: { id: refId } });
      if (!size) throw new NotFoundException('Vasija no encontrada');
      const existing = await this.items.findOne({ where: { userId, kind: 'size', sizeId: refId } });
      if (existing) {
        existing.qty += q;
        await this.items.save(existing);
      } else {
        await this.items.save({ userId, kind: 'size', sizeId: refId, addonId: null, qty: q } as any);
      }
    } else {
      const addon = await this.addons.findOne({ where: { id: refId } });
      if (!addon) throw new NotFoundException('Extra no encontrado');
      const existing = await this.items.findOne({
        where: { userId, kind: 'addon', addonId: refId },
      });
      if (existing) {
        existing.qty += q;
        await this.items.save(existing);
      } else {
        await this.items.save({
          userId,
          kind: 'addon',
          sizeId: null,
          addonId: refId,
          qty: q,
        } as any);
      }
    }
    return this.getCart(userId);
  }

  async patchQty(userId: string, id: string, qty: number) {
    const row = await this.items.findOne({ where: { id, userId } });
    if (!row) throw new NotFoundException('Línea no encontrada');
    if (qty < 1) {
      await this.items.remove(row);
    } else {
      row.qty = qty;
      await this.items.save(row);
    }
    return this.getCart(userId);
  }

  async remove(userId: string, id: string) {
    const row = await this.items.findOne({ where: { id, userId } });
    if (row) await this.items.remove(row);
    return this.getCart(userId);
  }
}
