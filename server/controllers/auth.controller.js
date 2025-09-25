import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import { generateTokenAndSetCookie } from "../libs/utils/generateToken.js";
import { initDefaultCategoriesForUser } from "./category.controller.js"; 

export const signUp = async (req, res) => {
  try {
    const { username, email, firstName, lastName, password } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (!username || !email || !firstName || !lastName || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format." });
    }
    if (existingUser) {
      return res.status(400).json({ message: "Username or email already exists." });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      firstName,
      lastName,
      password: hashedPassword,
    });

    await newUser.save();
    await initDefaultCategoriesForUser(newUser._id);
    generateTokenAndSetCookie(newUser._id, res);

    res.status(201).json({
      message: "User created successfully.",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    })
  } catch (error) {
    console.error("Error during signup:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}

export const signIn = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username && !email) {
      return res.status(400).json({ message: "Username or email is required." });
    }
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }

    const user = await User.findOne({ $or: [{ username }, { email }] }).select("+password");
    
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password." });
    }

    const token = generateTokenAndSetCookie(user._id, res);

    res.status(200).json({
      message: "User signed in successfully.",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      token, 
    });
  } catch (error) {
    console.error("Error during signin:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}

export const signOut = (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "Strict",
    });    
    res.status(200).json({ message: "User signed out successfully." });
  } catch (error) {
    console.error("Error during signout:", error);
    res.status(500).json({ message: "Internal server error." });
  }
}