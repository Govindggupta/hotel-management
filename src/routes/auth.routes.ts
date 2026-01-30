import { Router } from "express";
import { validate } from "../middleware/validate";
import { signupSchema, loginSchema } from "../validators/auth.validator";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.post("/signup", validate(signupSchema), authController.signup);
router.post("/login", validate(loginSchema), authController.login);

export default router;
