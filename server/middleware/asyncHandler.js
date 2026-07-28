// Wraps an async route handler so a rejected promise reaches Express's error
// pipeline via next(err) instead of becoming an unhandled rejection - lets
// every controller drop its own try/catch and just throw or await.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
