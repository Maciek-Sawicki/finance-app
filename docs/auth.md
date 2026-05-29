# Authentication

Base path: `/api/auth`

---

## POST /signup

Register a new user. Also creates default categories and user settings.

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

**Response `201`**
```json
{
  "message": "User created successfully.",
  "user": { "id": "...", "username": "johndoe", "email": "john@example.com", "firstName": "John", "lastName": "Doe" }
}
```

---

## POST /signIn

Sign in with email or username.

**Body**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response `200`**
```json
{
  "message": "User signed in successfully.",
  "user": { "id": "...", "username": "johndoe", "email": "john@example.com", "firstName": "John", "lastName": "Doe" },
  "token": "<jwt>"
}
```

> The token is also set as an `HttpOnly` cookie.

---

## POST /signout

Sign out the current user (clears the auth cookie).

**Response `200`**
```json
{ "message": "User signed out successfully." }
```

---

## GET /me 🔒

Return the currently authenticated user.

**Response `200`**
```json
{
  "user": { "_id": "...", "username": "johndoe", "email": "john@example.com", ... }
}
```

---

## Authentication

All protected routes (marked 🔒) require a JWT token as a `Bearer` header:

```
Authorization: Bearer <token>
```
