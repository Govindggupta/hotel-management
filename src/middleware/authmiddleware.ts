import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "../../db";

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

const authMiddleware = async (req: AuthRequest,res: Response,  next: NextFunction) => {
  try {
    // const authHeader = req.headers.authorization;
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "UNAUTHORIZED",
      });
    }


    const decodedToken = jwt.verify(token as string,process.env.JWT_SECRET as string) as JwtPayload;

    const user = await prisma.users.findUnique({
      where: { id: decodedToken.id },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: "INVALID_TOKEN",
      });
    }
    

    const {password: _, ...userWithoutPassword} = user;

    req.user = userWithoutPassword;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      data: null,
      error: "INVALID_OR_EXPIRED_TOKEN",
    });
  }
};

export default authMiddleware;
