import { z } from "zod";

export const createHotelSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  city: z.string().min(1, "City is required").max(100),
  country: z.string().min(1, "Country is required").max(100),
  amenities: z.union([z.array(z.unknown()), z.record(z.string(), z.unknown())]).optional().default([]),
});

export const createRoomSchema = z.object({
  roomNumber: z.string().min(1, "Room number is required").max(20),
  roomType: z.string().min(1, "Room type is required").max(50),
  pricePerNight: z.coerce.number().positive("Price must be positive"),
  maxOccupancy: z.coerce.number().int().positive("Max occupancy must be a positive integer"),
});

export const listHotelsQuerySchema = z.object({
  city: z.string().optional(),
  country: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
});

export const hotelIdParamSchema = z.object({
  hotelId: z.string().uuid("Invalid hotel ID"),
});

export type CreateHotelInput = z.infer<typeof createHotelSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type ListHotelsQuery = z.infer<typeof listHotelsQuerySchema>;
export type HotelIdParam = z.infer<typeof hotelIdParamSchema>;
