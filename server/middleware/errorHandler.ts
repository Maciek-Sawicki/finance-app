import type { ErrorRequestHandler } from "express";
import multer from "multer";

interface AppError extends Error {
  status?: number;
  code?: number | string;
  errors?: Record<string, { message: string }>;
}

// Single place that turns a thrown/rejected error into an HTTP response.
// Handles the domain-error convention used across services
// (Object.assign(new Error(message), { status })) plus the Mongoose error
// shapes that used to leak through as generic 500s.
export const errorHandler: ErrorRequestHandler = (err: AppError, req, res, next) => {
  console.error(`[${req.method} ${req.originalUrl}]`, err);

  // multer throws synchronously (e.g. a file over the configured size
  // limit) before a route handler ever runs - always a client mistake, so
  // it belongs in the 400 branch rather than falling through to a 500.
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File is too large." : err.message;
    return res.status(400).json({ message });
  }

  if (typeof err.status === "number") {
    return res.status(err.status).json({ message: err.message });
  }

  if (err.name === "ValidationError" && err.errors) {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: messages.join(", ") });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ message: "Invalid identifier." });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: "Duplicate value." });
  }

  res.status(500).json({ message: "Internal server error." });
};
