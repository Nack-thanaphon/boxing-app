import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { SeatsService } from './seats.service';
import { ReserveSeatDto } from './dto/reserve-seat.dto';
import { CancelReservationDto } from './dto/cancel-reservation.dto';

@Controller('api/v1/seats')
export class SeatsController {
  constructor(private readonly seatsService: SeatsService) {}

  @Get()
  async getSeats() {
    return this.seatsService.getSeats();
  }

  @Get(':id')
  async getSeat(@Param('id') id: string) {
    return this.seatsService.getSeat(id);
  }

  @Post('reserve')
  async reserveSeat(@Body() reserveSeatDto: ReserveSeatDto) {
    return this.seatsService.reserveSeat(reserveSeatDto);
  }

  @Post('cancel')
  async cancelReservation(@Body() cancelReservationDto: CancelReservationDto) {
    return this.seatsService.cancelReservation(cancelReservationDto);
  }
}
