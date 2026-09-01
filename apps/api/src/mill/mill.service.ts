import { HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EmailLog, MillDay, Order, Review } from '../entities/entities';
import { addDaysIso, madridToday } from '../util/madrid';

function conflict(code: string, message: string): never {
  throw new HttpException({ code, message }, HttpStatus.CONFLICT);
}

@Injectable()
export class MillService {
  constructor(
    @InjectRepository(MillDay) private readonly days: Repository<MillDay>,
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(EmailLog) private readonly emails: Repository<EmailLog>,
  ) {}

  serialize(day: MillDay, extra?: Record<string, unknown>) {
    return {
      id: day.id,
      millDate: day.millDate,
      kgSoaked: Number(day.kgSoaked),
      litersYield: day.litersYield,
      litersRemaining: day.litersRemaining,
      status: day.status,
      soakNotes: day.soakNotes,
      photoUrl: day.photoUrl,
      litersRemainingLiters: day.litersRemaining / 1000,
      litersYieldLiters: day.litersYield / 1000,
      ...extra,
    };
  }

  async today() {
    const millDate = madridToday();
    const day = await this.days.findOne({ where: { millDate } });
    if (!day) return null;
    return this.serialize(day);
  }

  async getOne(id: string) {
    const day = await this.days.findOne({ where: { id } });
    if (!day) throw new NotFoundException('Remojo no encontrado');
    const reviews = await this.reviews.find({
      where: { millDayId: id },
      order: { createdAt: 'DESC' },
    });
    return this.serialize(day, { reviews });
  }

  async listReviews(id: string) {
    return this.reviews.find({ where: { millDayId: id }, order: { createdAt: 'DESC' } });
  }

  async addReview(userId: string, millDayId: string, rating: number, body?: string) {
    const picked = await this.orders.findOne({
      where: { userId, millDayId, status: 'picked_up' },
    });
    if (!picked) {
      conflict('NOT_READY', 'Recoge el pedido de este remojo antes de dejar nota.');
    }
    const existing = await this.reviews.findOne({ where: { userId, millDayId } });
    if (existing) {
      conflict('ALREADY_REVIEWED', 'Ya dejaste nota de este remojo.');
    }
    return (await this.reviews.save({
      userId,
      millDayId,
      rating,
      body: body || null,
    } as any)) as Review;
  }

  async patchMill(
    id: string,
    dto: { kgSoaked?: number; litersYield?: number; status?: string; litersRemaining?: number },
  ) {
    const day = await this.days.findOne({ where: { id } });
    if (!day) throw new NotFoundException('Remojo no encontrado');
    if (dto.kgSoaked != null) day.kgSoaked = dto.kgSoaked;
    if (dto.litersYield != null) day.litersYield = dto.litersYield;
    if (dto.litersRemaining != null) day.litersRemaining = dto.litersRemaining;
    if (dto.status) day.status = dto.status;
    await this.days.save(day);
    return this.serialize(day);
  }

  async stats14d() {
    const today = madridToday();
    const from = addDaysIso(today, -13);
    const days = await this.days.find({ order: { millDate: 'ASC' } });
    const inRange = days.filter((d) => d.millDate >= from && d.millDate <= today);
    const dayIds = inRange.map((d) => d.id);
    const orders = dayIds.length
      ? await this.orders.find({ where: { millDayId: In(dayIds) } })
      : [];
    return inRange.map((d) => {
      const sold = orders
        .filter(
          (o) =>
            o.millDayId === d.id &&
            ['paid', 'milling', 'ready', 'picked_up'].includes(o.status),
        )
        .reduce((s, o) => s + o.totalMl, 0);
      return {
        date: d.millDate,
        litersYield: d.litersYield,
        litersSold: sold,
        yieldLiters: d.litersYield / 1000,
        soldLiters: sold / 1000,
      };
    });
  }

  async inbox(userId: string) {
    return this.emails.find({ where: { userId }, order: { createdAt: 'DESC' } });
  }
}
