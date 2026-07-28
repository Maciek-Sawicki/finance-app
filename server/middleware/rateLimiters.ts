import rateLimit from 'express-rate-limit';

// Brute-force protection on login - there was no throttling at all here
// before, so a credential-stuffing script could try passwords as fast as
// the server would accept connections.
export const signInLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many sign-in attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Looser than sign-in (it's a legitimate, infrequent action) but still
// bounded, to stop automated mass account creation.
export const signUpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { message: 'Too many accounts created from this address. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aggregation/report endpoints - each request runs one or more Mongo
// aggregation pipelines plus currency conversions.
export const reportLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 10,
  message: { message: 'Too many requests. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CSV import: parses the whole file in memory and writes potentially many
// transactions per request.
export const importLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: 'Too many imports. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// The public (unauthenticated) exchange-rate read endpoints - looser than
// reportLimiter since they're cheap reads, but every other route family has
// some bound and these previously had none at all.
export const publicRatesLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { message: 'Too many requests. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});
