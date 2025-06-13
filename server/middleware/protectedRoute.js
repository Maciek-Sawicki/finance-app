import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const protectRoute = async (req, res, next) => {
  try { 
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized access. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password"); 

    if (!user) {
      return res.status(404).json({ message: "Unauthorized: User not found" });
    }

    req.user = user; 
    next(); 
  } catch (error) {
    console.error("Error in protectRoute middleware:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}