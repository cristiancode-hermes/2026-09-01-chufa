import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 40, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  email: string;

  @Column({ type: 'varchar' })
  passwordHash: string;

  @Column({ type: 'varchar' })
  role: string;

  @Column({ type: 'int', default: 0 })
  points: number;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @OneToMany(() => Order, (o) => o.user)
  orders?: Order[];
}

@Entity('mill_days')
@Index(['millDate'], { unique: true })
export class MillDay {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date', unique: true })
  millDate: string;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  kgSoaked: number;

  @Column({ type: 'int' })
  litersYield: number;

  @Column({ type: 'int' })
  litersRemaining: number;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'simple-json', nullable: true })
  soakNotes: Record<string, unknown> | null;

  @Column({ type: 'varchar', nullable: true })
  photoUrl: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @OneToMany(() => Order, (o) => o.millDay)
  orders?: Order[];

  @OneToMany(() => Review, (r) => r.millDay)
  reviews?: Review[];
}

@Entity('sizes')
export class Size {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'int' })
  ml: number;

  @Column({ type: 'int' })
  priceCents: number;

  @Column({ type: 'text', nullable: true })
  blurb: string | null;

  @Column({ type: 'varchar', nullable: true })
  photoUrl: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;
}

@Entity('addons')
export class Addon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  slug: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'int' })
  priceCents: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'simple-json', nullable: true })
  nutTags: string[] | null;

  @Column({ type: 'varchar', nullable: true })
  photoUrl: string | null;
}

@Entity('cart_items')
@Index(['userId', 'kind', 'sizeId', 'addonId'], { unique: true })
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user?: User;

  @Column({ type: 'varchar' })
  kind: string;

  @Column({ type: 'varchar', nullable: true })
  sizeId: string | null;

  @ManyToOne(() => Size, { nullable: true })
  size?: Size | null;

  @Column({ type: 'varchar', nullable: true })
  addonId: string | null;

  @ManyToOne(() => Addon, { nullable: true })
  addon?: Addon | null;

  @Column({ type: 'int' })
  qty: number;
}

@Entity('orders')
@Index(['code'], { unique: true })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User, (u) => u.orders)
  user?: User;

  @Column({ type: 'varchar' })
  millDayId: string;

  @ManyToOne(() => MillDay, (d) => d.orders)
  millDay?: MillDay;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'varchar' })
  status: string;

  @Column({ type: 'int' })
  totalCents: number;

  @Column({ type: 'int' })
  totalMl: number;

  @Column({ type: 'int', default: 0 })
  pointsAwarded: number;

  @Column({ type: 'text', nullable: true })
  qrSvg: string | null;

  @Column({ type: 'varchar', nullable: true })
  qrUrl: string | null;

  @Column({ type: 'datetime', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @OneToMany(() => OrderLine, (l) => l.order)
  lines?: OrderLine[];

  @OneToMany(() => ScanEvent, (s) => s.order)
  scans?: ScanEvent[];
}

@Entity('order_lines')
export class OrderLine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  orderId: string;

  @ManyToOne(() => Order, (o) => o.lines, { onDelete: 'CASCADE' })
  order?: Order;

  @Column({ type: 'varchar' })
  kind: string;

  @Column({ type: 'varchar' })
  refId: string;

  @Column({ type: 'varchar' })
  nameSnapshot: string;

  @Column({ type: 'int' })
  unitPriceCents: number;

  @Column({ type: 'int' })
  qty: number;

  @Column({ type: 'int', default: 0 })
  mlSnapshot: number;

  @Column({ type: 'int' })
  lineTotalCents: number;
}

@Entity('reviews')
@Index(['userId', 'millDayId'], { unique: true })
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @ManyToOne(() => User)
  user?: User;

  @Column({ type: 'varchar' })
  millDayId: string;

  @ManyToOne(() => MillDay, (d) => d.reviews)
  millDay?: MillDay;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}

@Entity('scan_events')
export class ScanEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  orderId: string;

  @ManyToOne(() => Order, (o) => o.scans, { onDelete: 'CASCADE' })
  order?: Order;

  @Column({ type: 'varchar' })
  staffId: string;

  @ManyToOne(() => User)
  staff?: User;

  @Column({ type: 'varchar' })
  kind: string;

  @Column({ type: 'varchar', nullable: true })
  rawInput: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}

@Entity('email_logs')
export class EmailLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  userId: string;

  @Column({ type: 'varchar', nullable: true })
  orderId: string | null;

  @Column({ type: 'varchar' })
  kind: string;

  @Column({ type: 'varchar' })
  toEmail: string;

  @Column({ type: 'text' })
  body: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;
}

export const ALL_ENTITIES = [
  User,
  MillDay,
  Size,
  Addon,
  CartItem,
  Order,
  OrderLine,
  Review,
  ScanEvent,
  EmailLog,
];
