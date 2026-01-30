import { Router, Request, Response } from "express";
import {prisma} from '../../db';
import authMiddleware from "../middleware/authmiddleware";
import { bookingStatus } from "../../generated/prisma/enums";

const router = Router();

router.post('/', authMiddleware, async (req:Request, res: Response) => {
    //@ts-ignore
    const user = req.user ; 
    const {roomId , checkInDate , checkOutDate , guests} = req.body

    const hotel = await prisma.hotels.findFirst({
        where: {
            owner_id: user.id 
        }
    })
    if (hotel?.owner_id == user.id ) {
        return res.status(403).json({
            success: false, 
            data: null , 
            error: "FORBIDDEN"
        })
    }

    try {
      const room = await prisma.rooms.findUnique({
        where: {
          id: roomId,
        },
        select: {
            id: true, 
            hotel_id: true, 
            room_number: true, 
            room_type: true, 
            price_per_night: true, 
            max_occupancy: true, 
            bookings: true
        }
      });

      if (!room) {
        return res.status(404).json({
            success:false, 
            data:null, 
            error: "ROOM_NOT_FOUND"
        })
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);

      const overlappingBooking = await prisma.bookings.findFirst({
        where: {
          room_id: room.id,
          status: "CONFIRMED",
          AND: [
            { check_in_date: { lt: checkOut } },
            { check_out_date: { gt: checkIn } },
          ],
        },
      });

      if (overlappingBooking) {
        return res.status(409).json({
          success: false,
          data: null,
          error: "ROOM_NOT_AVAILABLE",
        });
      }


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
          error: "INVALID_REQUEST",
        });
      }

      if (room?.max_occupancy as number < guests) {
        return res.status(400).json({
          success: false,
          data: null,
          error: "INVALID_CAPICITY",
        });
      }


      const nights = Math.ceil((+checkOut - +checkIn ))/ (1000 * 60 * 60 * 24  )
      const totalPrice = nights * Number(room?.price_per_night)

      const booking = await prisma.bookings.create({
        data: {
            user_id: user.id, 
            room_id: room?.id, 
            hotel_id: room?.hotel_id, 
            check_in_date: checkIn, 
            check_out_date: checkOut, 
            guests: guests,
            total_price:  totalPrice, 
            status : "CONFIRMED" , 
            booking_date: checkIn
        }
      })

      return res.status(200).json({
        success: true, 
        data:{
            id : booking.room_id, 
            userId: booking.user_id, 
            roomId: booking.room_id,
            hotelId : booking.hotel_id, 
            checkInDate: booking.check_in_date, 
            checkOutDate: booking.check_out_date, 
            guests: booking.guests, 
            totalPrice: booking.total_price, 
            status : booking.status, 
            bookingDate: booking.booking_date
        },
        error: null
      })

    } catch (error) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST",
      });
    }
})

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  //@ts-ignore
  const user = req.user;
  const statusParam = req.query.status as string | undefined;

  let statusFilter: bookingStatus | undefined;

  if (statusParam) {
    if (!Object.values(bookingStatus).includes(statusParam as bookingStatus)) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_STATUS",
      });
    }

    statusFilter = statusParam as bookingStatus;
  }

  try {
    const bookings = await prisma.bookings.findMany({
      where: {
        user_id: user.id,
        ...(statusFilter && { status: statusFilter }),
      }, 
      select: {
        id: true, 
        room_id: true, 
        hotel_id: true, 
        room: {
          select: {
            room_number: true, 
            room_type: true, 
            hotel: {
              select: {
                name: true
              }
            }
          }
        },
        check_in_date: true,
        check_out_date: true, 
        guests: true, 
        total_price: true, 
        status: true, 
        booking_date: true
      }
    });

    const formattedBooking = bookings.map((booking) => ({
      id : booking.id, 
      roomId : booking.room_id, 
      hotelId : booking.hotel_id, 
      hotelName: booking.room.hotel.name, 
      roomNumber : booking.room.room_number, 
      roomType: booking.room.room_type, 
      checkInDate : booking.check_in_date, 
      checkOutDate: booking.check_out_date, 
      guests: booking.guests, 
      totalPrice: booking.total_price, 
      status : booking.status, 
      bookingDate: booking.booking_date
    }))

    return res.status(200).json({
      success: true,
      data: formattedBooking,
      error: null,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_SCHEMA",
    });
  }
});

router.put('/:bookingId/cancel', authMiddleware, async (req:Request, res: Response) => {

  //@ts-ignore
  const user = req.user;
  const bookingId = req.params.bookingId

  try {

    const booking = await prisma.bookings.findFirst({
      where : {
        id: bookingId as string
      }
    })

    if (!booking) {
      return res.status(404).json({
        success: false , 
        data: null, 
        error: "BOOKING_NOT_FOUND"
      })
    }

    if (user.id !== booking?.user_id) {
      return res.status(403).json({
        success: false, 
        data: null, 
        error: "FORBIDDEN"
      })
    }

    if (booking?.status === bookingStatus.CANCELLED) {
      return res.status(400).json({
        success: false, 
        data: null, 
        error: "ALREADY_CANCELLED"
      })
    }

    const now = new Date();
    const checkInDate = new Date(booking.check_in_date);

    const hoursUntillChekin = (+checkInDate - +now )/ (1000 * 60 * 60); 
    
    if ( hoursUntillChekin < 24) {
      return res.status(400).json({
        success: false, 
        data: false , 
        error: "CANCELLATION_DEADLINE_PASSED"
      })
    }

    const cancelledBooking = await prisma.bookings.update({
      where : {
        id : bookingId as string
      }, 
      data : {
        cancelled_at: now, 
        status: bookingStatus.CANCELLED, 
      }, 
      select: {
        id: true, 
        status: true, 
        cancelled_at: true
      }
    })

    res.status(200).json({
      success: true, 
      data:{
        id : cancelledBooking.id, 
        status: cancelledBooking.status, 
        cancelledAt : cancelledBooking.cancelled_at
      }, 
      error: null
    })
    
  } catch (error) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }
})

export default router;