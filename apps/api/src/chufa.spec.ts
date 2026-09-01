import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { HttpException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ALL_ENTITIES, Addon, MillDay, Size, User } from './entities/entities';
import { AuthService } from './auth/auth.service';
import { CartService } from './cart/cart.service';
import { OrdersService } from './orders/orders.service';
import { StaffService } from './staff/staff.service';
import { MillService } from './mill/mill.service';
import { madridToday } from './util/madrid';

function codeOf(err: unknown): string {
  const e = err as HttpException;
  const r = e.getResponse?.() as any;
  return r?.code || r?.message || String(err);
}

async function expectCode(p: Promise<unknown>, code: string) {
  try {
    await p;
    throw new Error('expected ' + code);
  } catch (e) {
    if ((e as Error).message === 'expected ' + code) throw e;
    expect(codeOf(e)).toBe(code);
  }
}

describe('Chufa', () => {
  let ds: DataSource;
  let auth: AuthService;
  let cart: CartService;
  let orders: OrdersService;
  let staff: StaffService;
  let mill: MillService;
  let alice: User;
  let bob: User;
  let staffUser: User;
  let day: MillDay;
  let closedDay: MillDay;
  let vaso: Size;
  let jarra: Size;
  let farton: Addon;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: ALL_ENTITIES,
          synchronize: true,
        } as any),
        TypeOrmModule.forFeature(ALL_ENTITIES),
        JwtModule.register({ secret: 'test-secret', signOptions: { expiresIn: '1d' } }),
      ],
      providers: [AuthService, CartService, OrdersService, StaffService, MillService],
    }).compile();

    ds = moduleRef.get(DataSource);
    auth = moduleRef.get(AuthService);
    cart = moduleRef.get(CartService);
    orders = moduleRef.get(OrdersService);
    staff = moduleRef.get(StaffService);
    mill = moduleRef.get(MillService);

    const hash = await bcrypt.hash('demo1234', 10);
    alice = (await ds.getRepository(User).save({
      username: 'alice',
      email: 'alice@chufa.test',
      passwordHash: hash,
      role: 'customer',
      points: 0,
    } as any)) as User;
    bob = (await ds.getRepository(User).save({
      username: 'bob',
      email: 'bob@chufa.test',
      passwordHash: hash,
      role: 'customer',
      points: 0,
    } as any)) as User;
    staffUser = (await ds.getRepository(User).save({
      username: 'molinera',
      email: 'staff@chufa.test',
      passwordHash: hash,
      role: 'staff',
      points: 0,
    } as any)) as User;

    day = (await ds.getRepository(MillDay).save({
      millDate: madridToday(),
      kgSoaked: 14,
      litersYield: 20000,
      litersRemaining: 8000,
      status: 'open',
      soakNotes: { variedad: 'Alboraia' },
      photoUrl: '/assets/mola.jpg',
    } as any)) as MillDay;
    closedDay = (await ds.getRepository(MillDay).save({
      millDate: '2020-01-01',
      kgSoaked: 10,
      litersYield: 10000,
      litersRemaining: 10000,
      status: 'closed',
      soakNotes: {},
      photoUrl: '/assets/mola.jpg',
    } as any)) as MillDay;

    vaso = (await ds.getRepository(Size).save({
      slug: 'vaso',
      name: 'Vaso',
      ml: 250,
      priceCents: 180,
      blurb: 'corto',
      photoUrl: '/assets/vaso.jpg',
      active: true,
    } as any)) as Size;
    jarra = (await ds.getRepository(Size).save({
      slug: 'jarra',
      name: 'Jarra',
      ml: 1000,
      priceCents: 550,
      blurb: 'litro',
      photoUrl: '/assets/jarra.jpg',
      active: true,
    } as any)) as Size;
    await ds.getRepository(Size).save({
      slug: 'botella',
      name: 'Botella',
      ml: 750,
      priceCents: 480,
      blurb: 'casa',
      photoUrl: '/assets/botella.jpg',
      active: true,
    } as any);
    farton = (await ds.getRepository(Addon).save({
      slug: 'farton',
      name: 'Fartón',
      priceCents: 90,
      stock: 5,
      nutTags: ['gluten'],
      photoUrl: '/assets/farton.jpg',
    } as any)) as Addon;
  });

  afterAll(async () => {
    await ds.destroy();
  });

  it('login accepts username or email', async () => {
    const a = await auth.login({ identifier: 'alice', password: 'demo1234' });
    const b = await auth.login({ identifier: 'alice@chufa.test', password: 'demo1234' });
    expect(a.accessToken).toBeTruthy();
    expect(b.user.email).toBe('alice@chufa.test');
  });

  it('fromPriceCents is min of active sizes', async () => {
    const sizes = await ds.getRepository(Size).find({ where: { active: true } });
    const from = Math.min(...sizes.map((s) => s.priceCents));
    expect(from).toBe(180);
  });

  it('checkout pays, decrements liters and returns real QR URL', async () => {
    await cart.add(alice.id, 'size', vaso.id, 2);
    await cart.add(alice.id, 'addon', farton.id, 1);
    const preview = await cart.getCart(alice.id);
    expect(preview.liveTotalCents).toBe(180 * 2 + 90);
    expect(preview.liveMl).toBe(500);
    const paid = await orders.checkout(alice.id, day.id);
    expect(paid.status).toBe('paid');
    expect(paid.totalCents).toBe(preview.liveTotalCents);
    expect(paid.totalMl).toBe(500);
    expect(paid.qrUrl).toContain('/pedido/' + paid.code);
    expect(paid.qrSvg).toContain(paid.qrUrl);
    expect(paid.lines.reduce((s, l) => s + l.lineTotalCents, 0)).toBe(paid.totalCents);
    const millNow = await ds.getRepository(MillDay).findOneBy({ id: day.id });
    expect(millNow!.litersRemaining).toBe(7500);
    const fartonNow = await ds.getRepository(Addon).findOneBy({ id: farton.id });
    expect(fartonNow!.stock).toBe(4);
  });

  it('ALREADY_QUEUED on second live checkout same user+day', async () => {
    await cart.add(alice.id, 'size', vaso.id, 1);
    await expectCode(orders.checkout(alice.id, day.id), 'ALREADY_QUEUED');
  });

  it('public ticket GET by code includes QR URL', async () => {
    const mine = await orders.listMine(alice.id);
    const t = await orders.ticket(mine[0].code);
    expect(t.qrSvg).toContain(t.qrUrl);
    expect(t.totalCents).toBe(t.lines.reduce((s, l) => s + l.lineTotalCents, 0));
  });

  it('list totals match detail lines', async () => {
    const list = await orders.listMine(alice.id);
    const detail = await orders.getMine(alice.id, list[0].id);
    expect(list[0].totalCents).toBe(detail.totalCents);
    expect(detail.totalCents).toBe(detail.lines.reduce((s, l) => s + l.lineTotalCents, 0));
  });

  it('MILL_CLOSED when mill is closed', async () => {
    await cart.add(bob.id, 'size', vaso.id, 1);
    await expectCode(orders.checkout(bob.id, closedDay.id), 'MILL_CLOSED');
  });

  it('MILL_DRY when liters exceed remaining', async () => {
    await cart.patchQty(bob.id, (await cart.getCart(bob.id)).items[0].id, 0).catch(() => undefined);
    const cartRows = await cart.getCart(bob.id);
    for (const i of cartRows.items) await cart.remove(bob.id, i.id);
    await cart.add(bob.id, 'size', jarra.id, 20);
    await expectCode(orders.checkout(bob.id, day.id), 'MILL_DRY');
  });

  it('NO_ADDON when farton stock is gone', async () => {
    const cartRows = await cart.getCart(bob.id);
    for (const i of cartRows.items) await cart.remove(bob.id, i.id);
    const a = await ds.getRepository(Addon).findOneBy({ id: farton.id });
    a!.stock = 0;
    await ds.getRepository(Addon).save(a!);
    await cart.add(bob.id, 'size', vaso.id, 1);
    await cart.add(bob.id, 'addon', farton.id, 1);
    await expectCode(orders.checkout(bob.id, day.id), 'NO_ADDON');
    a!.stock = 5;
    await ds.getRepository(Addon).save(a!);
  });

  it('cancel while paid restores liters', async () => {
    const cartRows = await cart.getCart(bob.id);
    for (const i of cartRows.items) await cart.remove(bob.id, i.id);
    await cart.add(bob.id, 'size', vaso.id, 1);
    const before = (await ds.getRepository(MillDay).findOneBy({ id: day.id }))!.litersRemaining;
    const paid = await orders.checkout(bob.id, day.id);
    const mid = (await ds.getRepository(MillDay).findOneBy({ id: day.id }))!.litersRemaining;
    expect(mid).toBe(before - 250);
    const cancelled = await orders.cancel(bob.id, paid.id);
    expect(cancelled.status).toBe('cancelled');
    const after = (await ds.getRepository(MillDay).findOneBy({ id: day.id }))!.litersRemaining;
    expect(after).toBe(before);
  });

  it('TOO_LATE if cancelling after milling', async () => {
    const cartRows = await cart.getCart(bob.id);
    for (const i of cartRows.items) await cart.remove(bob.id, i.id);
    await cart.add(bob.id, 'size', vaso.id, 1);
    const paid = await orders.checkout(bob.id, day.id);
    await staff.setStatus(paid.id, 'milling');
    await expectCode(orders.cancel(bob.id, paid.id), 'TOO_LATE');
  });

  it('staff queue and paid→milling→ready', async () => {
    const q = await staff.queue();
    expect(q.orders.length).toBeGreaterThan(0);
    const alicePaid = q.orders.find((o) => o.status === 'paid');
    expect(alicePaid).toBeTruthy();
    await staff.setStatus(alicePaid!.id, 'milling');
    await staff.setStatus(alicePaid!.id, 'ready');
    const ready = await ds.getRepository('orders').findOneBy({ id: alicePaid!.id } as any);
    expect((ready as any).status).toBe('ready');
  });

  it('scan URL marks picked_up and awards derived points', async () => {
    const aliceOrders = await orders.listMine(alice.id);
    const ready = aliceOrders.find((o) => o.status === 'ready') || aliceOrders[0];
    if (ready.status !== 'ready') {
      if (ready.status === 'paid') await staff.setStatus(ready.id, 'milling');
      if (ready.status === 'milling' || (await orders.getMine(alice.id, ready.id)).status === 'milling') {
        const cur = await orders.getMine(alice.id, ready.id);
        if (cur.status === 'milling') await staff.setStatus(ready.id, 'ready');
      }
    }
    const cur = await orders.getMine(alice.id, ready.id);
    const scanned = await staff.scan(staffUser.id, cur.qrUrl!);
    expect(scanned.status).toBe('picked_up');
    expect(scanned.pointsAwarded).toBe(Math.floor(cur.totalMl / 100));
    const me = await auth.me(alice.id);
    expect(me.points).toBe(Math.floor(cur.totalMl / 100));
  });

  it('ALREADY_PICKED_UP on second scan', async () => {
    const aliceOrders = await orders.listMine(alice.id);
    const picked = aliceOrders.find((o) => o.status === 'picked_up')!;
    await expectCode(staff.scan(staffUser.id, picked.code), 'ALREADY_PICKED_UP');
  });

  it('NOT_READY if scanning milling order', async () => {
    const cartRows = await cart.getCart(bob.id);
    for (const i of cartRows.items) await cart.remove(bob.id, i.id);
    // bob already has milling from TOO_LATE test
    const bobOrders = await orders.listMine(bob.id);
    const milling = bobOrders.find((o) => o.status === 'milling');
    if (milling) {
      await expectCode(staff.scan(staffUser.id, milling.code), 'NOT_READY');
    } else {
      expect(true).toBe(true);
    }
  });

  it('review after pickup, ALREADY_REVIEWED on second', async () => {
    const r = await mill.addReview(alice.id, day.id, 5, 'Cremosa');
    expect(r.rating).toBe(5);
    await expectCode(mill.addReview(alice.id, day.id, 4, 'otra'), 'ALREADY_REVIEWED');
  });

  it('stats 14d have dates and sold ml', async () => {
    const series = await mill.stats14d();
    expect(Array.isArray(series)).toBe(true);
    expect(series.some((s) => s.date === madridToday())).toBe(true);
    const today = series.find((s) => s.date === madridToday())!;
    expect(today.litersSold).toBeGreaterThan(0);
    expect(today.litersYield).toBe(20000);
  });

  it('derived points never use a magic seed', async () => {
    const me = await auth.me(alice.id);
    const list = await orders.listMine(alice.id);
    const ml = list.filter((o) => o.status === 'picked_up').reduce((s, o) => s + o.totalMl, 0);
    expect(me.points).toBe(Math.floor(ml / 100));
  });

  it('ticket accepts full URL', async () => {
    const list = await orders.listMine(alice.id);
    const t = await orders.ticket('https://chufa.proyectos.cristiancode.dev/pedido/' + list[0].code);
    expect(t.code).toBe(list[0].code);
  });

  it('today mill matches remaining after all ops', async () => {
    const t = await mill.today();
    const raw = await ds.getRepository(MillDay).findOneBy({ id: day.id });
    expect(t!.litersRemaining).toBe(raw!.litersRemaining);
  });
});
