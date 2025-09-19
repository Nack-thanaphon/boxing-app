import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

@Entity('payment_logs')
export class PaymentLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: LogLevel,
    default: LogLevel.INFO,
  })
  level: LogLevel;

  @Column({ type: 'varchar', length: 255 })
  message: string;

  @Column({ type: 'json', nullable: true })
  metadata: any;

  @Column({ type: 'varchar', length: 255, nullable: true })
  payment_id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  omise_charge_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  action: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  status: string;

  @CreateDateColumn()
  created_at: Date;
}
