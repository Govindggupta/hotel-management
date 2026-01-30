import { Router, Request, Response } from "express";
import {prisma} from '../../db';
import authMiddleware from "../middleware/authmiddleware";

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

router.get('/', authMiddleware, async (req:Request, res: Response) => {

})
router.post('/:bookingId/cancel', authMiddleware, async (req:Request, res: Response) => {})

export default router;