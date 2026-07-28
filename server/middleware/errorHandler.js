// Single place that turns a thrown/rejected error into an HTTP response.
// Handles the domain-error convention used across services
// (Object.assign(new Error(message), { status })) plus the Mongoose error
// shapes that used to leak through as generic 500s.
export const errorHandler = (err, req, res, next) => {
  console.error(`[${req.method} ${req.originalUrl}]`, err);

  if (typeof err.status === "number") {
    return res.status(err.status).json({ message: err.message });
  }

  if (err.name === "ValidationError") {
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
