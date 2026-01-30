import { Router } from "express";
import authMiddleware from "../middleware/authmiddleware";
import { validate } from "../middleware/validate";
import {
  createBookingSchema,
  listBookingsQuerySchema,
  bookingIdParamSchema,
} from "../validators/booking.validator";
import * as bookingController from "../controllers/booking.controller";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validate(createBookingSchema),
  bookingController.createBooking,
);

// Match both "" and "/" so GET /api/bookings works when router receives empty path
router.get(
  ["/", ""],
  authMiddleware,
  validate(listBookingsQuerySchema, "query"),
  bookingController.listBookings,
);

router.put(
  "/:bookingId/cancel",
  authMiddleware,
  validate(bookingIdParamSchema, "params"),
  bookingController.cancelBooking,
);

export default router;
