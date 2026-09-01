import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';
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
import { addDaysIso, madridToday, webOrigin } from '../util/madrid';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly log = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(MillDay) private readonly days: Repository<MillDay>,
    @InjectRepository(Size) private readonly sizes: Repository<Size>,
    @InjectRepository(Addon) private readonly addons: Repository<Addon>,
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(OrderLine) private readonly lines: Repository<OrderLine>,
    @InjectRepository(Review) private readonly reviews: Repository<Review>,
    @InjectRepository(EmailLog) private readonly emails: Repository<EmailLog>,
  ) {}

  async onModuleInit() {
    if (process.env.SEED_DB === 'false') return;
    try {
      await this.seed();
    } catch (e) {
      this.log.error(e);
    }
  }

  async seed() {
    if (await this.users.count()) {
      this.log.log('Seed skipped (users exist)');
      return;
    }

    const hash = await bcrypt.hash('demo1234', 10);
    const demo = (await this.users.save({
      username: 'demo',
      email: 'demo@chufa.dev',
      passwordHash: hash,
      role: 'customer',
      points: 0,
    } as any)) as User;
    const vecina = (await this.users.save({
      username: 'vecina',
      email: 'vecina@chufa.dev',
      passwordHash: hash,
      role: 'customer',
      points: 0,
    } as any)) as User;
    const staff = (await this.users.save({
      username: 'molinera',
      email: 'molienda@chufa.dev',
      passwordHash: hash,
      role: 'staff',
      points: 0,
    } as any)) as User;
    await this.users.save({
      username: 'admin',
      email: 'admin@chufa.dev',
      passwordHash: hash,
      role: 'admin',
      points: 0,
    } as any);
    void staff;

    const sizeDefs = [
      {
        slug: 'vaso',
        name: 'Vaso de cristal',
        ml: 250,
        priceCents: 180,
        blurb: 'El trago corto de la barra, con hielo picado.',
        photoUrl: '/assets/vaso.jpg',
      },
      {
        slug: 'jarra',
        name: 'Jarra de litro',
        ml: 1000,
        priceCents: 550,
        blurb: 'Para la sobremesa de la horta.',
        photoUrl: '/assets/jarra.jpg',
      },
      {
        slug: 'botella',
        name: 'Botella de vidrio',
        ml: 750,
        priceCents: 480,
        blurb: 'Se lleva a casa, tapón de corcho.',
        photoUrl: '/assets/botella.jpg',
      },
      {
        slug: 'cubo',
        name: 'Cubo de fiesta',
        ml: 3000,
        priceCents: 1400,
        blurb: 'Tres litros y fartones a parte.',
        photoUrl: '/assets/cubo.jpg',
      },
    ];
    const sizeRows: Size[] = [];
    for (const def of sizeDefs) {
      sizeRows.push((await this.sizes.save({ ...def, active: true } as any)) as Size);
    }
    const vaso = sizeRows.find((s) => s.slug === 'vaso')!;
    const jarra = sizeRows.find((s) => s.slug === 'jarra')!;
    const botella = sizeRows.find((s) => s.slug === 'botella')!;

    const farton = (await this.addons.save({
      slug: 'farton',
      name: 'Fartón de horno',
      priceCents: 90,
      stock: 40,
      nutTags: ['gluten'],
      photoUrl: '/assets/farton.jpg',
    } as any)) as Addon;
    await this.addons.save({
      slug: 'canela',
      name: 'Canela en rama',
      priceCents: 40,
      stock: 80,
      nutTags: [],
      photoUrl: '/assets/canela.jpg',
    } as any);
    await this.addons.save({
      slug: 'limon',
      name: 'Corteza de limón',
      priceCents: 30,
      stock: 60,
      nutTags: [],
      photoUrl: '/assets/limon.jpg',
    } as any);

    const today = madridToday();
    const millByDate = new Map<string, MillDay>();
    for (let i = 13; i >= 0; i--) {
      const millDate = addDaysIso(today, -i);
      const yieldMl = 18000 + ((i * 700) % 4000);
      const remaining = i === 0 ? 12000 : Math.max(800, yieldMl - 9000 - i * 200);
      const status = i === 0 ? 'open' : 'closed';
      const day = (await this.days.save({
        millDate,
        kgSoaked: 12 + (i % 4),
        litersYield: yieldMl,
        litersRemaining: remaining,
        status,
        soakNotes: { variedad: i % 2 ? 'chufa valenciana' : 'chufa de Alboraia', horas: 12 },
        photoUrl: '/assets/mola.jpg',
      } as any)) as MillDay;
      millByDate.set(millDate, day);
    }

    const makeOrder = async (opts: {
      user: User;
      day: MillDay;
      status: string;
      code: string;
      size: Size;
      qty: number;
      addon?: { addon: Addon; qty: number };
    }) => {
      const ml = opts.size.ml * opts.qty;
      const lineCents = opts.size.priceCents * opts.qty;
      const addonCents = opts.addon ? opts.addon.addon.priceCents * opts.addon.qty : 0;
      const totalCents = lineCents + addonCents;
      const qrUrl = `${webOrigin()}/pedido/${opts.code}`;
      const rawSvg = await QRCode.toString(qrUrl, { type: 'svg', margin: 1, width: 240 });
      const qrSvg = rawSvg.includes(qrUrl)
        ? rawSvg
        : rawSvg.replace('</svg>', `<desc>${qrUrl}</desc></svg>`);
      const pointsAwarded = opts.status === 'picked_up' ? Math.floor(ml / 100) : 0;
      const order = (await this.orders.save({
        userId: opts.user.id,
        millDayId: opts.day.id,
        code: opts.code,
        status: opts.status,
        totalCents,
        totalMl: ml,
        pointsAwarded,
        qrSvg,
        qrUrl,
        paidAt: new Date(),
      } as any)) as Order;
      await this.lines.save({
        orderId: order.id,
        kind: 'size',
        refId: opts.size.id,
        nameSnapshot: opts.size.name,
        unitPriceCents: opts.size.priceCents,
        qty: opts.qty,
        mlSnapshot: ml,
        lineTotalCents: lineCents,
      } as any);
      if (opts.addon) {
        await this.lines.save({
          orderId: order.id,
          kind: 'addon',
          refId: opts.addon.addon.id,
          nameSnapshot: opts.addon.addon.name,
          unitPriceCents: opts.addon.addon.priceCents,
          qty: opts.addon.qty,
          mlSnapshot: 0,
          lineTotalCents: opts.addon.addon.priceCents * opts.addon.qty,
        } as any);
      }
      await this.emails.save({
        userId: opts.user.id,
        orderId: order.id,
        kind: opts.status,
        toEmail: opts.user.email,
        body: `Encargo ${opts.code} en estado ${opts.status}.`,
      } as any);
      return order;
    };

    const d1 = millByDate.get(addDaysIso(today, -2))!;
    const d2 = millByDate.get(addDaysIso(today, -5))!;
    const d3 = millByDate.get(addDaysIso(today, -8))!;
    const todayDay = millByDate.get(today)!;

    await makeOrder({
      user: demo,
      day: d1,
      status: 'picked_up',
      code: 'XFA-DEMO01',
      size: jarra,
      qty: 1,
      addon: { addon: farton, qty: 2 },
    });
    await makeOrder({
      user: demo,
      day: d2,
      status: 'picked_up',
      code: 'XFA-DEMO02',
      size: botella,
      qty: 1,
    });
    await makeOrder({
      user: demo,
      day: d3,
      status: 'cancelled',
      code: 'XFA-DEMO03',
      size: vaso,
      qty: 2,
    });
    await makeOrder({
      user: vecina,
      day: todayDay,
      status: 'paid',
      code: 'XFA-VECINA1',
      size: vaso,
      qty: 1,
    });
    await makeOrder({
      user: vecina,
      day: d1,
      status: 'picked_up',
      code: 'XFA-VECINA2',
      size: jarra,
      qty: 1,
    });

    const picked = await this.orders.find({ where: { status: 'picked_up' } });
    const byUser = new Map<string, number>();
    for (const o of picked) {
      byUser.set(o.userId, (byUser.get(o.userId) || 0) + o.totalMl);
    }
    for (const [uid, ml] of byUser) {
      const u = await this.users.findOne({ where: { id: uid } });
      if (u) {
        u.points = Math.floor(ml / 100);
        await this.users.save(u);
      }
    }

    await this.reviews.save({
      userId: demo.id,
      millDayId: d1.id,
      rating: 5,
      body: 'La de Alboraia sale más cremosa. El fartón aguanta el vaso.',
    } as any);

    this.log.log('Seed complete');
  }
}
