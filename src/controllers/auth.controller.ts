import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../../db";
import type { SignupInput, LoginInput } from "../validators/auth.validator";

function normalizeRole(role: string): "CUSTOMER" | "OWNER" {
  const r = role.toUpperCase();
  return r === "OWNER" ? "OWNER" : "CUSTOMER";
}

export async function signup(req: Request, res: Response) {
  const body = req.validatedBody! as SignupInput;

  const existingUser = await prisma.users.findUnique({
    where: { email: body.email },
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      data: null,
      error: "EMAIL_ALREADY_EXISTS",
    });
  }

  const hashedPassword = await bcrypt.hash(body.password, 10);

  const user = await prisma.users.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: normalizeRole(body.role),
      phone: body.phone ?? null,
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
}

export async function login(req: Request, res: Response) {
  const body = req.validatedBody! as LoginInput;

  const user = await prisma.users.findUnique({
    where: { email: body.email },
  });

  const passwordMatch = user ? await bcrypt.compare(body.password, user.password) : false;

  if (!user || !passwordMatch) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "INVALID_CREDENTIALS",
    });
  }

  const token = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET as string,
  );

  return res.status(200).json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
    error: null,
  });
}
