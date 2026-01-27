import { Router, Request, Response } from "express";
import {prisma} from '../../db'

const router = Router();

router.post('/signup',  async (req:Request, res:Response) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  try {
    const user = await prisma.users.create({
      data: {
        name,
        email,
        password, // TODO: hash in real app
        role,
        phone,
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