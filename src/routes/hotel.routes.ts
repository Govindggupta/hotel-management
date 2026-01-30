import { Router } from "express";
import authMiddleware from "../middleware/authmiddleware";
import { validate } from "../middleware/validate";
import {
  createHotelSchema,
  createRoomSchema,
  listHotelsQuerySchema,
  hotelIdParamSchema,
} from "../validators/hotel.validator";
import * as hotelController from "../controllers/hotel.controller";

const router = Router();

router.post(
  "/",
  authMiddleware,
  validate(createHotelSchema),
  hotelController.createHotel,
);

router.post(
  "/:hotelId/rooms",
  authMiddleware,
  validate(hotelIdParamSchema, "params"),
  validate(createRoomSchema),
  hotelController.createRoom,
);

router.get(
  "/",
  authMiddleware,
  validate(listHotelsQuerySchema, "query"),
  hotelController.listHotels,
);

router.get(
  "/:hotelId",
  authMiddleware,
  validate(hotelIdParamSchema, "params"),
  hotelController.getHotelById,
);

export default router;
