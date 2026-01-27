import { Router, Request, Response } from "express";
import {prisma} from '../../db'

const router = Router();

router.post('/signup',  async (req:Request, res:Response) => {

  const body = req.body ?? {};
  const { name, email, password, role, phone } = body;



  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    // Normalize role to match Prisma enum userRole (CUSTOMER/OWNER)
    let normalizedRole: "CUSTOMER" | "OWNER" | undefined;
    if (typeof role === "string") {
      const lower = role.toLowerCase();
      if (lower === "owner") normalizedRole = "OWNER";
      else if (lower === "customer") normalizedRole = "CUSTOMER";
    }

    // Normalize phone to Int? as defined in Prisma schema
    let normalizedPhone: number | undefined;
    if (phone !== undefined && phone !== null) {
      const digits = String(phone).replace(/\D/g, "");
      if (digits.length > 0) {
        normalizedPhone = parseInt(digits, 10);
      }
    }

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password, // TODO: hash in real app
        // if normalizedRole is undefined, Prisma will use default(CUSTOMER)
        ...(normalizedRole ? { role: normalizedRole } : {}),
        ...(normalizedPhone !== undefined ? { phone: normalizedPhone } : {}),
      },
    });

    const { password: _pw, ...safeUser } = user;

    return res.status(201).json({
      message: "User created successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
