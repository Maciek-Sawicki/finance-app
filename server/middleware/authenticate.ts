import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token =
      req.cookies.token ||
      (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("Missing JWT_SECRET environment variable.");
    }

    const decoded = jwt.verify(token, secret);
    const id = typeof decoded === "object" ? decoded.id : undefined;
    if (!id) {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Unauthorized: User not found." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error in authenticate middleware:", error);

    if (error instanceof Error && error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
    if (error instanceof Error && error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }

    res.status(500).json({ message: "Internal server error." });
  }
};
