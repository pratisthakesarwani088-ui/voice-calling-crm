# context/

React Context providers for global state.

- `AuthContext.jsx` — the logged-in user, plus login/register/logout
  actions. Wraps the app in App.jsx; access it via the `useAuth()` hook
  rather than importing this context directly.
- `ToastContext.jsx` — Module 5: global toast/notification state (success/
  error/info messages). Access it via the `useToast()` hook. Not
  customer-specific — reusable by any future module's CRUD flows.
