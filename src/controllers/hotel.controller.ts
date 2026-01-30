import { Request, Response } from "express";
import { prisma } from "../../db";
import type { CreateHotelInput, CreateRoomInput, ListHotelsQuery, HotelIdParam } from "../validators/hotel.validator";

export async function createHotel(req: Request, res: Response) {
  const user = req.user!;
  const body = req.validatedBody! as CreateHotelInput;

  if (user.role !== "OWNER") {
    return res.status(403).json({
      success: false,
      data: null,
      error: "FORBIDDEN",
    });
  }

  const hotel = await prisma.hotels.create({
    data: {
      owner_id: user.id,
      name: body.name,
      city: body.city,
      country: body.country,
      description: body.description ?? null,
      amenities: (body.amenities ?? []) as Parameters<typeof prisma.hotels.create>[0]["data"]["amenities"],
    },
  });

  const { createdAt: _, ...rest } = hotel;
  return res.status(201).json({
    success: true,
    data: rest,
    error: null,
  });
}

export async function createRoom(req: Request, res: Response) {
  const user = req.user!;
  const { hotelId } = req.validatedParams! as HotelIdParam;
  const body = req.validatedBody! as CreateRoomInput;

  const hotel = await prisma.hotels.findUnique({
    where: { id: hotelId },
  });

  if (!hotel) {
    return res.status(404).json({
      success: false,
      data: null,
      error: "HOTEL_NOT_FOUND",
    });
  }

  if (hotel.owner_id !== user.id) {
    return res.status(403).json({
      success: false,
      data: null,
      error: "FORBIDDEN",
    });
  }

  const existingRoom = await prisma.rooms.findFirst({
    where: {
      hotel_id: hotelId,
      room_number: body.roomNumber,
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
      hotel_id: hotelId,
      room_number: body.roomNumber,
      room_type: body.roomType,
      price_per_night: body.pricePerNight,
      max_occupancy: body.maxOccupancy,
    },
  });

  const { createdAt: _, ...rest } = room;
  return res.status(201).json({
    success: true,
    data: rest,
    error: null,
  });
}

export async function listHotels(req: Request, res: Response) {
  const query = req.validatedQuery! as ListHotelsQuery;

  const where: Record<string, unknown> = {};

  if (query.city) {
    where.city = { equals: query.city, mode: "insensitive" as const };
  }
  if (query.country) {
    where.country = { equals: query.country, mode: "insensitive" as const };
  }
  if (query.minRating != null) {
    where.rating = { gte: query.minRating };
  }
  if (query.minPrice != null || query.maxPrice != null) {
    where.rooms = {
      some: {
        price_per_night: {
          ...(query.minPrice != null && { gte: query.minPrice }),
          ...(query.maxPrice != null && { lte: query.maxPrice }),
        },
      },
    };
  }

  const hotels = await prisma.hotels.findMany({
    where,
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
        select: { price_per_night: true },
      },
    },
  });

  const formatted = hotels.map((hotel) => {
    const prices = hotel.rooms.map((r) => Number(r.price_per_night));
    return {
      id: hotel.id,
      name: hotel.name,
      description: hotel.description,
      city: hotel.city,
      country: hotel.country,
      amenities: hotel.amenities,
      rating: Number(hotel.rating),
      totalReviews: hotel.total_reviews,
      minPricePerNight: prices.length > 0 ? Math.min(...prices) : null,
    };
  });

  return res.status(200).json({
    success: true,
    data: formatted,
    error: null,
  });
}

export async function getHotelById(req: Request, res: Response) {
  const { hotelId } = req.validatedParams! as HotelIdParam;

  const hotel = await prisma.hotels.findUnique({
    where: { id: hotelId },
    select: {
      id: true,
      owner_id: true,
      name: true,
      description: true,
      city: true,
      country: true,
      amenities: true,
      rating: true,
      total_reviews: true,
      rooms: {
        select: {
          id: true,
          room_number: true,
          room_type: true,
          price_per_night: true,
          max_occupancy: true,
        },
      },
    },
  });

  if (!hotel) {
    return res.status(404).json({
      success: false,
      data: null,
      error: "HOTEL_NOT_FOUND",
    });
  }

  const formatted = {
    ...hotel,
    ownerId: hotel.owner_id,
    totalReviews: hotel.total_reviews,
    rating: Number(hotel.rating),
    rooms: hotel.rooms.map((room) => ({
      id: room.id,
      roomNumber: room.room_number,
      roomType: room.room_type,
      pricePerNight: Number(room.price_per_night),
      maxOccupancy: room.max_occupancy,
    })),
  };

  return res.status(200).json({
    success: true,
    data: formatted,
    error: null,
  });
}
