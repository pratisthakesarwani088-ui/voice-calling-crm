# Authentication — Module 3

## Overview

This CRM is a **single-user application** — only one Admin account is
ever supported. There is no invite flow, role management, or
multi-account switching, in this module or any future one.

## Endpoints

All under `API_V1_PREFIX` (default `/api/v1`), prefixed with `/auth`.

| Method | Path             | Auth required | Purpose                          |
|--------|------------------|:--------------:|-----------------------------------|
| POST   | `/auth/register` | No             | Create the one Admin account (only works once) |
| POST   | `/auth/login`     | No             | Exchange email + password for a JWT |
| POST   | `/auth/logout`    | Yes            | Client-side session end (see note below) |
| GET    | `/auth/me`        | Yes            | Return the current user's profile |

### POST /auth/register
Request:
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Str0ng!Pass",
  "confirm_password": "Str0ng!Pass"
}
```
- 201 on success → `{ "message": "...", "user": { ... } }`
- 403 if an account already exists ("Registration is closed...")
- 409 if the email is already taken (only reachable in a race condition,
  since 403 normally fires first once an account exists)
- 422 on validation failure (weak password, mismatched confirm, bad email)

### POST /auth/login
Request: `{ "email": "...", "password": "..." }`
- 200 → `{ "access_token", "token_type": "bearer", "expires_in_minutes", "user" }`
- 401 on wrong email/password (generic message, doesn't reveal which)
- 403 if the account exists but isn't ACTIVE

### POST /auth/logout
- Requires `Authorization: Bearer <token>`
- 200 → `{ "message": "Logged out successfully." }`
- See "Known limitation" below — this does not revoke the token server-side.

### GET /auth/me
- Requires `Authorization: Bearer <token>`
- 200 → the current user (id, full_name, email, role, status, created_at)

## Auth flow

```
1. First run:      POST /auth/register  →  Admin account created
2. Every session:   POST /auth/login    →  JWT issued, stored in
                                             localStorage by the frontend
3. Each request:    Authorization: Bearer <token>  →  attached
                     automatically by the frontend's Axios interceptor
4. Protected route: get_current_user dependency decodes the JWT,
                     loads the user, checks status == ACTIVE
5. Logout:          frontend discards the token; backend call is a
                     courtesy no-op (see limitation below)
```

## Security notes

- Passwords are hashed with bcrypt via passlib — plaintext is never stored.
- JWT is signed with `SECRET_KEY`/`ALGORITHM` from environment variables,
  expires after `ACCESS_TOKEN_EXPIRE_MINUTES` (also env-driven).
- Login always returns the same generic "Invalid email or password" for
  both a wrong email and a wrong password, so a failed attempt never
  reveals which part was wrong.
- Email is stored and compared lowercase to prevent case-variant duplicates.

## Known limitation: logout doesn't revoke the JWT server-side

JWTs are stateless by design. This project does not implement a
token blacklist/session store — that's a deliberate scope boundary for
this module, not an oversight. In practice this means a token issued
before logout remains technically valid (to the backend) until it
naturally expires, even after the user clicks "Logout." The frontend
mitigates this by discarding the token immediately, so the browser
itself can't use it again. If stronger server-side revocation is ever
needed, the standard fix is a short-lived access token + a refresh
token with a server-side blacklist — that's a meaningfully sized
addition, intentionally left for a future module rather than folded in
here.

## Environment variables (backend/.env)

| Variable                       | Purpose                                  |
|---------------------------------|--------------------------------------------|
| `SECRET_KEY`                    | JWT signing key — generate a long random value |
| `ALGORITHM`                     | JWT signing algorithm (default `HS256`)   |
| `ACCESS_TOKEN_EXPIRE_MINUTES`   | Token lifetime in minutes (default `60`)  |

Generate a strong secret:
```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

## Manual testing steps

```bash
# 1. Register the (only) Admin account
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Jane Doe","email":"jane@example.com","password":"Str0ng!Pass","confirm_password":"Str0ng!Pass"}'

# 2. Try registering again — should now return 403
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Someone Else","email":"someone@example.com","password":"Str0ng!Pass","confirm_password":"Str0ng!Pass"}'

# 3. Log in
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"Str0ng!Pass"}'
# copy the access_token from the response

# 4. Call the protected /me endpoint
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <paste_token_here>"

# 5. Log out
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer <paste_token_here>"
```

Frontend: visit `/signup` to create the account, `/login` to sign in —
a successful login redirects to `/dashboard` (protected; redirects back
to `/login` if you're not authenticated).
