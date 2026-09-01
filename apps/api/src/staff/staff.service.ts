import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmailLog, MillDay, Order, ScanEvent, User } from '../entities/entities';
import { madridToday } from '../util/madrid';

function conflict(code: string, message: string): never {
  throw new HttpException({ code, message }, HttpStatus.CONFLICT);
}

const LEGAL: Record<string, string[]> = {
  paid: ['milling'],
  milling: ['ready'],
};

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(MillDay) private readonly days: Repository<MillDay>,
    @InjectRepository(ScanEvent) private readonly scans: Repository<ScanEvent>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(EmailLog) private readonly emails: Repository<EmailLog>,
  ) {}

  async queue() {
    const millDate = madridToday();
    const day = await this.days.findOne({ where: { millDate } });
    if (!day) return { millDate, orders: [] };
    const orders = await this.orders.find({
      where: { millDayId: day.id, status: In(['paid', 'milling', 'ready']) },
      relations: { lines: true },
      order: { createdAt: 'ASC' },
    });
    return {
      millDate,
      millDayId: day.id,
      orders: orders.map((o) => ({
        id: o.id,
        code: o.code,
        status: o.status,
        totalCents: (o.lines || []).reduce((s, l) => s + l.lineTotalCents, 0),
        totalMl: (o.lines || []).reduce((s, l) => s + l.mlSnapshot, 0),
        paidAt: o.paidAt,
      })),
    };
  }

  async setStatus(id: string, status: string) {
    const order = await this.orders.findOne({ where: { id }, relations: { lines: true } });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    const allowed = LEGAL[order.status] || [];
    if (!allowed.includes(status)) {
      conflict('NOT_READY', 'Aún se está moliendo. Espera a «listo».');
    }
    order.status = status;
    await this.orders.save(order);
    return order;
  }

  extractCode(raw: string): string {
    const trimmed = (raw || '').trim();
    if (trimmed.includes('/pedido/')) {
      return trimmed.split('/pedido/').pop()!.split(/[?#]/)[0].toUpperCase();
    }
    return trimmed.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
  }

  async scan(staffId: string, codeOrUrl: string) {
    const code = this.extractCode(codeOrUrl);
    const order = await this.orders.findOne({
      where: { code },
      relations: { lines: true },
    });
    if (!order) {
      throw new HttpException(
        { code: 'NOT_FOUND', message: 'No hay un pedido con ese código.' },
        HttpStatus.CONFLICT,
      );
    }
    if (order.status === 'picked_up') {
      conflict('ALREADY_PICKED_UP', 'Este pedido ya salió del mostrador.');
    }
    if (order.status !== 'ready') {
      conflict('NOT_READY', 'Aún se está moliendo. Espera a «listo».');
    }
    order.status = 'picked_up';
    const ml = (order.lines || []).reduce((s, l) => s + l.mlSnapshot, 0);
    order.pointsAwarded = Math.floor(ml / 100);
    await this.orders.save(order);

    const user = await this.users.findOne({ where: { id: order.userId } });
    if (user) {
      const picked = await this.orders.find({ where: { userId: user.id, status: 'picked_up' } });
      user.points = Math.floor(picked.reduce((s, o) => s + o.totalMl, 0) / 100);
      await this.users.save(user);
    }

    await this.scans.save({
      orderId: order.id,
      staffId,
      kind: 'pickup',
      rawInput: codeOrUrl,
    } as any);

    await this.emails.save({
      userId: order.userId,
      orderId: order.id,
      kind: 'picked_up',
      toEmail: user?.email || '',
      body: `Pedido ${order.code} recogido. +${order.pointsAwarded} puntos de mola.`,
    } as any);

    return order;
  }
}
