import { Request, Response } from "express";
import { prisma } from "../../db";
import { bookingStatus } from "../../generated/prisma/enums";
import type { CreateBookingInput, ListBookingsQuery, BookingIdParam } from "../validators/booking.validator";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const CANCELLATION_HOURS = 24;

export async function createBooking(req: Request, res: Response) {
  const user = req.user!;
  const body = req.validatedBody! as CreateBookingInput;

  const room = await prisma.rooms.findUnique({
    where: { id: body.roomId },
    include: { hotel: true },
  });

  if (!room) {
    return res.status(404).json({
      success: false,
      data: null,
      error: "ROOM_NOT_FOUND",
    });
  }

  if (room.hotel.owner_id === user.id) {
    return res.status(403).json({
      success: false,
      data: null,
      error: "FORBIDDEN",
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkIn = new Date(body.checkInDate);
  const checkOut = new Date(body.checkOutDate);

  if (checkIn <= today) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_DATES",
    });
  }

  if (checkOut <= checkIn) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_DATES",
    });
  }

  if (room.max_occupancy < body.guests) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_CAPACITY",
    });
  }

  const overlapping = await prisma.bookings.findFirst({
    where: {
      room_id: room.id,
      status: bookingStatus.CONFIRMED,
      AND: [
        { check_in_date: { lt: checkOut } },
        { check_out_date: { gt: checkIn } },
      ],
    },
  });

  if (overlapping) {
    return res.status(409).json({
      success: false,
      data: null,
      error: "ROOM_NOT_AVAILABLE",
    });
  }

  const nights = Math.ceil((+checkOut - +checkIn) / MS_PER_DAY);
  const totalPrice = nights * Number(room.price_per_night);

  const booking = await prisma.bookings.create({
    data: {
      user_id: user.id,
      room_id: room.id,
      hotel_id: room.hotel_id,
      check_in_date: checkIn,
      check_out_date: checkOut,
      guests: body.guests,
      total_price: totalPrice,
      status: bookingStatus.CONFIRMED,
      booking_date: checkIn,
    },
  });

  return res.status(201).json({
    success: true,
    data: {
      id: booking.id,
      userId: booking.user_id,
      roomId: booking.room_id,
      hotelId: booking.hotel_id,
      checkInDate: booking.check_in_date,
      checkOutDate: booking.check_out_date,
      guests: booking.guests,
      totalPrice: Number(booking.total_price),
      status: booking.status,
      bookingDate: booking.booking_date,
    },
    error: null,
  });
}

export async function listBookings(req: Request, res: Response) {
  const user = req.user!;
  const query = req.validatedQuery! as ListBookingsQuery;

  const bookings = await prisma.bookings.findMany({
    where: {
      user_id: user.id,
      ...(query.status && { status: query.status }),
    },
    select: {
      id: true,
      room_id: true,
      hotel_id: true,
      check_in_date: true,
      check_out_date: true,
      guests: true,
      total_price: true,
      status: true,
      booking_date: true,
      room: {
        select: {
          room_number: true,
          room_type: true,
          hotel: { select: { name: true } },
        },
      },
    },
  });

  const formatted = bookings.map((b) => ({
    id: b.id,
    roomId: b.room_id,
    hotelId: b.hotel_id,
    hotelName: b.room.hotel.name,
    roomNumber: b.room.room_number,
    roomType: b.room.room_type,
    checkInDate: b.check_in_date,
    checkOutDate: b.check_out_date,
    guests: b.guests,
    totalPrice: Number(b.total_price),
    status: b.status,
    bookingDate: b.booking_date,
  }));

  return res.status(200).json({
    success: true,
    data: formatted,
    error: null,
  });
}

export async function cancelBooking(req: Request, res: Response) {
  const user = req.user!;
  const { bookingId } = req.validatedParams! as BookingIdParam;

  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
  });

  if (!booking) {
    return res.status(404).json({
      success: false,
      data: null,
      error: "BOOKING_NOT_FOUND",
    });
  }

  if (booking.user_id !== user.id) {
    return res.status(403).json({
      success: false,
      data: null,
      error: "FORBIDDEN",
    });
  }

  if (booking.status === bookingStatus.CANCELLED) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "ALREADY_CANCELLED",
    });
  }

  const checkIn = new Date(booking.check_in_date);
  const hoursUntilCheckIn = (+checkIn - Date.now()) / (1000 * 60 * 60);

  if (hoursUntilCheckIn < CANCELLATION_HOURS) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "CANCELLATION_DEADLINE_PASSED",
    });
  }

  const now = new Date();
  const cancelled = await prisma.bookings.update({
    where: { id: bookingId },
    data: { cancelled_at: now, status: bookingStatus.CANCELLED },
    select: { id: true, status: true, cancelled_at: true },
  });

  return res.status(200).json({
    success: true,
    data: {
      id: cancelled.id,
      status: cancelled.status,
      cancelledAt: cancelled.cancelled_at,
    },
    error: null,
  });
}
