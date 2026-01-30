import { Router, Request, Response } from "express";
import {prisma} from '../../db';
import bcrypt from 'bcrypt';
import jsonwebtoken from 'jsonwebtoken';

const router = Router();

router.post("/signup", async (req: Request, res: Response) => {
  const { name, email, password, phone, role } = req.body;

  const userRole = role.toUpperCase();

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }

  try {
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        data: null,
        error: "EMAIL_ALREADY_EXISTS",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role: userRole,
      },
    });


    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
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

router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "INVALID_REQUEST",
    });
  }

  try {
    const user = await prisma.users.findUnique({
      where: {
        email,
      },
    });

    const passwordMatch = bcrypt.compare(password, user?.password as string);


    if (!user || !passwordMatch) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "INVALID_CREDENTIALS",
      });
    }

    const token = jsonwebtoken.sign(
      { id: user?.id },
      process.env.JWT_SECRET as string,
    );

    return res.status(200).json({
      success: true,
      data: {
        token: token,
        user: {
          id : user.id,
          name: user.name, 
          email : user.email, 
          role : user.role
        } 
      },
      error:null 
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
