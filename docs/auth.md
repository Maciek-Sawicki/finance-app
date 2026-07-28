# Authentication

Base path: `/api/auth`

Session is a JWT stored in an `httpOnly` cookie (`token`), set on sign up/sign in and cleared on sign out. The client never sees or stores the token directly — it's sent automatically by the browser on every request (`withCredentials: true`). `Authorization: Bearer <token>` is still accepted as a fallback on the server, but nothing in the app sends it anymore.

---

## POST /signup

Rate limited: 5 requests / hour per IP.

Register a new user. Runs as a single database transaction — creates the user, seeds default categories, and creates a default `Settings` document; if any step fails, nothing is left behind.

**Body**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePass123",
  "country": "US"
}
```

`password` must be at least 8 characters. `country` is optional (defaults to `"US"`).

**Response `201`**
```json
{
  "message": "User created successfully.",
  "user": { "id": "...", "username": "johndoe", "email": "john@example.com", "firstName": "John", "lastName": "Doe" }
}
```

Also sets the `token` cookie.

---

## POST /signin

Rate limited: 10 requests / 15 min per IP.

Sign in with email or username.

**Body**
```json
{
  "username": "johndoe",
  "password": "SecurePass123"
}
```

`username` or `email` is required, plus `password`.

**Response `200`**
```json
{
  "message": "User signed in successfully.",
  "user": { "id": "...", "username": "johndoe", "email": "john@example.com", "firstName": "John", "lastName": "Doe" }
}
```

Also sets the `token` cookie. The response body never contains the token.

**Response `401`** — `{ "message": "Invalid credentials." }` for both an unknown username/email and a wrong password. Deliberately identical in both cases so the response can't be used to enumerate registered accounts.

---

## POST /signout

Clears the `token` cookie. Must be called by the client to actually end the session — the cookie won't clear itself.

**Response `200`**
```json
{ "message": "User signed out successfully." }
```

---

## GET /me 🔒

Return the currently authenticated user (used by the client on app load to check session state).

**Response `200`**
```json
{
  "user": { "_id": "...", "username": "johndoe", "email": "john@example.com", "firstName": "John", "lastName": "Doe", "createdAt": "...", "country": "US" }
}
```

**Response `401`** — no valid token (missing/expired/invalid).

---

## 🔒 meaning

Endpoints marked 🔒 across all docs require a valid session — either the `token` cookie (normal case) or an `Authorization: Bearer <token>` header (fallback, not used by the client). Without one: `401 { "message": "Unauthorized: No token provided." }`.
