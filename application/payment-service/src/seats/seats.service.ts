import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Seat, SeatStatus } from '../database/entities/seat.entity';
import { LoggerService } from '../common/logger/logger.service';
import { ReserveSeatDto } from './dto/reserve-seat.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';

@Injectable()
export class SeatsService {
  constructor(
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
    private loggerService: LoggerService,
  ) {}

  async getSeats(): Promise<Seat[]> {
    return this.seatRepository.find({
      order: { seat_number: 'ASC' },
    });
  }

  async getSeat(id: string): Promise<Seat> {
    const seat = await this.seatRepository.findOne({ where: { id } });
    if (!seat) {
      throw new NotFoundException('Seat not found');
    }
    return seat;
  }

  async reserveSeat(reserveSeatDto: ReserveSeatDto): Promise<Seat> {
    const { seat_id, customer_email, duration_minutes = 15 } = reserveSeatDto;

    const seat = await this.seatRepository.findOne({ where: { id: seat_id } });
    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    if (seat.status !== SeatStatus.AVAILABLE) {
      throw new BadRequestException('Seat is not available for reservation');
    }

    seat.status = SeatStatus.RESERVED;
    seat.reserved_until = new Date(Date.now() + duration_minutes * 60 * 1000);
    seat.reserved_by = customer_email;

    const updatedSeat = await this.seatRepository.save(seat);

    await this.loggerService.logPayment(
      'info',
      'Seat reserved successfully',
      { seat_id, customer_email, duration_minutes },
      null,
      null,
      'reserve_seat',
      'reserved',
    );

    return updatedSeat;
  }

  async cancelReservation(
    cancelReservationDto: CancelReservationDto,
  ): Promise<Seat> {
    const { seat_id, customer_email } = cancelReservationDto;

    const seat = await this.seatRepository.findOne({ where: { id: seat_id } });
    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    if (seat.status !== SeatStatus.RESERVED) {
      throw new BadRequestException('Seat is not reserved');
    }

    if (seat.reserved_by !== customer_email) {
      throw new BadRequestException(
        'You can only cancel your own reservations',
      );
    }

    seat.status = SeatStatus.AVAILABLE;
    seat.reserved_until = null;
    seat.reserved_by = null;

    const updatedSeat = await this.seatRepository.save(seat);

    await this.loggerService.logPayment(
      'info',
      'Seat reservation cancelled',
      { seat_id, customer_email },
      null,
      null,
      'cancel_reservation',
      'cancelled',
    );

    return updatedSeat;
  }

  async createSeats(): Promise<void> {
    // Create sample seats if none exist
    const count = await this.seatRepository.count();
    if (count === 0) {
      const seats = [];
      for (let i = 1; i <= 50; i++) {
        seats.push(
          this.seatRepository.create({
            seat_number: `A${i.toString().padStart(2, '0')}`,
            section: 'A',
            row: Math.ceil(i / 10).toString(),
            price: 100 + (i % 5) * 50,
            status: SeatStatus.AVAILABLE,
          }),
        );
      }
      await this.seatRepository.save(seats);
      console.log('Created 50 sample seats');
    }
  }
}
