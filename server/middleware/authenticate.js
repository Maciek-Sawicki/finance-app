import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const authenticate = async (req, res, next) => {
  try {
    // 1 Get token from cookies or Authorization header
    const token =
      req.cookies.token ||
      (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided." });
    }

    // 2️ Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded?.id) {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    // 3 Find user by ID
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Unauthorized: User not found." });
    }

    // 4️ Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error("Error in authenticate middleware:", error);

    // 5 Handle specific JWT errors
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }

    res.status(500).json({ message: "Internal server error." });
  }
};