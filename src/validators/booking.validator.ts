 import { z } from "zod";

const dateString = z.string().refine((s) => !isNaN(Date.parse(s)), { message: "Invalid date" });

export const createBookingSchema = z
  .object({
    roomId: z.string().uuid("Invalid room ID"),
    checkInDate: dateString,
    checkOutDate: dateString,
    guests: z.coerce.number().int().positive("Guests must be a positive integer"),
  })
  .refine(
    (data) => new Date(data.checkOutDate) > new Date(data.checkInDate),
    { message: "Check-out must be after check-in", path: ["checkOutDate"] },
  );

// Express query params can be string | string[]; accept both and normalize
export const listBookingsQuerySchema = z.object({
  status: z
    .preprocess(
      (val) => (Array.isArray(val) ? val[0] : val),
      z.enum(["CONFIRMED", "CANCELLED"]).optional(),
    ),
});

export const bookingIdParamSchema = z.object({
  bookingId: z.string().uuid("Invalid booking ID"),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type ListBookingsQuery = z.infer<typeof listBookingsQuerySchema>;
export type BookingIdParam = z.infer<typeof bookingIdParamSchema>;
