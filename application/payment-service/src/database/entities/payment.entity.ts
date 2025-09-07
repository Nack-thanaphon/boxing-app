import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Seat } from './seat.entity';

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CARD = 'card',
  BANK_TRANSFER = 'bank_transfer',
  WECHAT_PAY = 'wechat_pay',
  PROMPT_PAY = 'promptpay',
  TRUE_MONEY = 'truemoney',
  INTERNET_BANKING_SCB = 'internet_banking_scb',
  INTERNET_BANKING_BAY = 'internet_banking_bay',
  INTERNET_BANKING_BBL = 'internet_banking_bbl',
  INTERNET_BANKING_KBANK = 'internet_banking_kbank',
  INTERNET_BANKING_KTB = 'internet_banking_ktb',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  omise_charge_id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', length: 3, default: 'THB' })
  currency: string;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  payment_method: PaymentMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customer_email: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ type: 'uuid', nullable: true })
  seat_id: string;

  @ManyToOne(() => Seat, { nullable: true })
  @JoinColumn({ name: 'seat_id' })
  seat: Seat;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
