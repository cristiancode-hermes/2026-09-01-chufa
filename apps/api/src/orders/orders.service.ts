import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { CartService } from '../cart/cart.service';
import {
  Addon,
  CartItem,
  EmailLog,
  MillDay,
  Order,
  OrderLine,
  Size,
  User,
} from '../entities/entities';
import { LIVE_STATUSES, orderCode, webOrigin } from '../util/madrid';

function conflict(code: string, message: string): never {
  throw new HttpException({ code, message }, HttpStatus.CONFLICT);
}

let lock: Promise<void> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = lock.then(fn, fn);
  lock = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly cart: CartService,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
  ) {}

  serialize(order: Order) {
    const lines = order.lines || [];
    const totalCents = lines.reduce((s, l) => s + l.lineTotalCents, 0);
    const totalMl = lines.reduce((s, l) => s + (l.mlSnapshot || 0), 0);
    return {
      id: order.id,
      userId: order.userId,
      millDayId: order.millDayId,
      code: order.code,
      status: order.status,
      totalCents,
      totalMl,
      pointsAwarded: order.pointsAwarded,
      qrSvg: order.qrSvg,
      qrUrl: order.qrUrl,
      paidAt: order.paidAt,
      createdAt: order.createdAt,
      lines: lines.map((l) => ({
        id: l.id,
        kind: l.kind,
        refId: l.refId,
        nameSnapshot: l.nameSnapshot,
        unitPriceCents: l.unitPriceCents,
        qty: l.qty,
        mlSnapshot: l.mlSnapshot,
        lineTotalCents: l.lineTotalCents,
      })),
    };
  }

  async checkout(userId: string, millDayId: string, _paymentNonce?: string) {
    return withLock(() => this.checkoutLocked(userId, millDayId));
  }

  private async checkoutLocked(userId: string, millDayId: string) {
    const cart = await this.cart.getCart(userId);
    if (!cart.items.length) {
      conflict('NO_ADDON', 'La bandeja está vacía. Elige una vasija.');
    }

    const supportsLock = this.dataSource.options.type !== 'better-sqlite3';

    return this.dataSource.transaction(async (manager) => {
      const millRepo = manager.getRepository(MillDay);
      const qb = millRepo.createQueryBuilder('d').where('d.id = :id', { id: millDayId });
      const mill = supportsLock ? await qb.setLock('pessimistic_write').getOne() : await qb.getOne();
      if (!mill) throw new NotFoundException('Remojo no encontrado');
      if (mill.status === 'closed' || mill.status === 'soaking') {
        conflict('MILL_CLOSED', 'Hoy la mola está cerrada.');
      }

      const live = await manager.getRepository(Order).find({
        where: { userId, millDayId, status: In([...LIVE_STATUSES]) },
      });
      if (live.length) {
        conflict('ALREADY_QUEUED', 'Ya tienes un encargo vivo para este remojo.');
      }

      const sizeIds = cart.items.filter((i) => i.kind === 'size').map((i) => i.refId as string);
      const addonIds = cart.items.filter((i) => i.kind === 'addon').map((i) => i.refId as string);
      const sizes = sizeIds.length
        ? await manager.getRepository(Size).find({ where: { id: In(sizeIds) } })
        : [];
      const sizeBy = new Map(sizes.map((s) => [s.id, s]));

      const addonRepo = manager.getRepository(Addon);
      const addons: Addon[] = [];
      for (const id of addonIds) {
        const aqb = addonRepo.createQueryBuilder('a').where('a.id = :id', { id });
        const a = supportsLock ? await aqb.setLock('pessimistic_write').getOne() : await aqb.getOne();
        if (!a) throw new NotFoundException('Extra no encontrado');
        addons.push(a);
      }
      const addonBy = new Map(addons.map((a) => [a.id, a]));

      let needMl = 0;
      for (const line of cart.items) {
        if (line.kind === 'size') {
          const size = sizeBy.get(line.refId as string);
          if (!size) throw new NotFoundException('Vasija no encontrada');
          needMl += size.ml * line.qty;
        } else {
          const addon = addonBy.get(line.refId as string);
          if (!addon || addon.stock < line.qty) {
            conflict('NO_ADDON', 'Ese fartón se ha acabado. Quítalo de la bandeja.');
          }
        }
      }

      if (needMl > mill.litersRemaining) {
        conflict('MILL_DRY', 'El remojo de hoy no da para tantos litros. Baja la vasija.');
      }
      if (needMl <= 0) {
        conflict('NO_ADDON', 'Elige al menos una vasija.');
      }

      mill.litersRemaining -= needMl;
      await millRepo.save(mill);

      for (const line of cart.items) {
        if (line.kind === 'addon') {
          const addon = addonBy.get(line.refId as string)!;
          addon.stock -= line.qty;
          await addonRepo.save(addon);
        }
      }

      const code = orderCode();
      const qrUrl = `${webOrigin()}/pedido/${code}`;
      const rawSvg = await QRCode.toString(qrUrl, { type: 'svg', margin: 1, width: 240 });
      const qrSvg = rawSvg.includes(qrUrl)
        ? rawSvg
        : rawSvg.replace('</svg>', `<desc>${qrUrl}</desc></svg>`);
      const now = new Date();
      const totalCents = cart.liveTotalCents;
      const totalMl = needMl;

      const order = (await manager.getRepository(Order).save({
        userId,
        millDayId,
        code,
        status: 'paid',
        totalCents,
        totalMl,
        pointsAwarded: 0,
        qrSvg,
        qrUrl,
        paidAt: now,
        createdAt: now,
      } as any)) as Order;

      for (const line of cart.items) {
        const isSize = line.kind === 'size';
        const ref = isSize ? sizeBy.get(line.refId as string)! : addonBy.get(line.refId as string)!;
        await manager.getRepository(OrderLine).save({
          orderId: order.id,
          kind: line.kind,
          refId: line.refId,
          nameSnapshot: isSize ? (ref as Size).name : (ref as Addon).name,
          unitPriceCents: isSize ? (ref as Size).priceCents : (ref as Addon).priceCents,
          qty: line.qty,
          mlSnapshot: isSize ? (ref as Size).ml * line.qty : 0,
          lineTotalCents:
            (isSize ? (ref as Size).priceCents : (ref as Addon).priceCents) * line.qty,
        } as any);
      }

      const cartRows = await manager.getRepository(CartItem).find({ where: { userId } });
      if (cartRows.length) await manager.getRepository(CartItem).remove(cartRows);

      const user = await manager.getRepository(User).findOne({ where: { id: userId } });
      await manager.getRepository(EmailLog).save({
        userId,
        orderId: order.id,
        kind: 'paid',
        toEmail: user?.email || '',
        body: `Encargo ${code} cobrado. Recoge en mostrador con el QR.`,
      } as any);

      const full = await manager.getRepository(Order).findOne({
        where: { id: order.id },
        relations: { lines: true },
      });
      return this.serialize(full!);
    });
  }

  async listMine(userId: string) {
    const rows = await this.orders.find({
      where: { userId },
      relations: { lines: true },
      order: { createdAt: 'DESC' },
    });
    return rows.map((o) => this.serialize(o));
  }

  async getMine(userId: string, id: string) {
    const row = await this.orders.findOne({
      where: { id, userId },
      relations: { lines: true },
    });
    if (!row) throw new NotFoundException('Pedido no encontrado');
    return this.serialize(row);
  }

  async ticket(code: string) {
    const raw = code.includes('/pedido/') ? code.split('/pedido/').pop()! : code;
    const cleaned = raw.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
    const row = await this.orders.findOne({
      where: { code: cleaned },
      relations: { lines: true },
    });
    if (!row) throw new NotFoundException('Pedido no encontrado');
    return this.serialize(row);
  }

  async cancel(userId: string, id: string) {
    return withLock(() => this.cancelLocked(userId, id));
  }

  private async cancelLocked(userId: string, id: string) {
    return this.dataSource.transaction(async (manager) => {
      const order = await manager.getRepository(Order).findOne({
        where: { id, userId },
        relations: { lines: true },
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      if (order.status !== 'paid') {
        conflict('TOO_LATE', 'Ya empezamos a moler; no se puede cancelar.');
      }
      const mill = await manager.getRepository(MillDay).findOne({ where: { id: order.millDayId } });
      if (mill) {
        mill.litersRemaining += order.totalMl;
        await manager.getRepository(MillDay).save(mill);
      }
      for (const line of order.lines || []) {
        if (line.kind === 'addon') {
          const addon = await manager.getRepository(Addon).findOne({ where: { id: line.refId } });
          if (addon) {
            addon.stock += line.qty;
            await manager.getRepository(Addon).save(addon);
          }
        }
      }
      order.status = 'cancelled';
      await manager.getRepository(Order).save(order);
      const full = await manager.getRepository(Order).findOne({
        where: { id: order.id },
        relations: { lines: true },
      });
      return this.serialize(full!);
    });
  }
}
