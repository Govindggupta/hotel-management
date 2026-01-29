import { Router, Request, Response } from "express";
import {prisma} from '../../db';
import authMiddleware from "../middleware/authmiddleware";

const router = Router();

router.post('/' ,authMiddleware, async (req:Request, res:Response) => {
    //@ts-ignore
    const user = req.user


    if (user.role !== "OWNER") {
        return res.status(403).json({
            success: false,
            data: null,
            error: "FORBIDDEN"
        })
    }

     
    const { name , description , city , country, amenities} = req.body;

    if (!name || !city || !country) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "INVALID_REQUEST",
      });
    }
    try {
        const hotel = await prisma.hotels.create({
            data: {
                owner_id: user.id,
                name,
                city,
                country, 
                description, 
                amenities 
            }
        })

        const { createdAt: _, ...anotherhotel} = hotel;


        res.status(200).json({
            success: true, 
            data: anotherhotel, 
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

router.post('/:hotelId/rooms', authMiddleware, async (req: Request, res: Response) => {
  const { hotelId } = req.params;
  // @ts-ignore
  const owner = req.user;

  try {
    const hotel = await prisma.hotels.findUnique({
      where: {
        id: hotelId as string,
      },
    });

    if (!hotel) {
      return res.status(404).json({
        success: false,
        data: null,
        error: "HOTEL_NOT_FOUND",
      });
    }

    if (hotel.owner_id !== owner.id) {
      return res.status(403).json({
        success: false,
        data: null,
        error: "FORBIDDEN",
      });
    }

    const { roomNumber, roomType, pricePerNight, maxOccupancy } = req.body;

    const existingRoom = await prisma.rooms.findFirst({
      where: {
        hotel_id: hotelId as string,
        room_number: roomNumber,
      },
    });

    if (existingRoom) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "ROOM_ALREADY_EXISTS",
      });
    }

    const room = await prisma.rooms.create({
      data: {
        hotel_id: hotelId as string,
        room_number: roomNumber,
        room_type: roomType,
        price_per_night: pricePerNight,
        max_occupancy: maxOccupancy,
      },
    });

    const { createdAt: _, ...anotherRoom } = room;

    return res.status(201).json({
      success: true,
      data: anotherRoom,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }
});

router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { city, country, minPrice, maxPrice, minRating } = req.query;

    const whereClause: any = {};

    if (city) {
      whereClause.city = {
        equals: city as string,
        mode: "insensitive",
      };
    }

    if (country) {
      whereClause.country = {
        equals: country as string,
        mode: "insensitive",
      };
    }

    if (minRating) {
      whereClause.rating = {
        gte: Number(minRating),
      };
    }

    if (minPrice || maxPrice) {
      whereClause.rooms = {
        some: {
          price_per_night: {},
        },
      };

      if (minPrice) {
        whereClause.rooms.some.price_per_night.gte = Number(minPrice);
      }

      if (maxPrice) {
        whereClause.rooms.some.price_per_night.lte = Number(maxPrice);
      }
    }

    const hotels = await prisma.hotels.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        city: true,
        country: true,
        amenities: true,
        rating: true,
        total_reviews: true,
        rooms: {
          select: {
            price_per_night: true,
          },
        },
      },
    });

    const formattedHotels = hotels.map((hotel) => {
      const prices = hotel.rooms.map((room) => room.price_per_night.toNumber());

      return {
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        city: hotel.city,
        country: hotel.country,
        amenities: hotel.amenities,
        rating: hotel.rating,
        totalReviews: hotel.total_reviews,
        minPricePerNight:prices.length > 0 ? Math.min(...prices) : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedHotels,
      error: null,
    });
  } catch (error) {
    console.error(error);
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }
});

export default router;

