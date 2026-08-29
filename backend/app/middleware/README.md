# middleware/

Cross-cutting request/response concerns.

- `cors.py` — CORS configuration
- `auth.py` — `get_current_user` dependency; add
  `Depends(get_current_user)` to any route to make it a protected route
