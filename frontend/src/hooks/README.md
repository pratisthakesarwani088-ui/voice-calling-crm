# hooks/

Custom React hooks that encapsulate reusable stateful logic.

- `useBackendHealth.js` — Module 1: backend connectivity check
- `useAuth.js`           — Module 3: reads AuthContext (current user,
  login/register/logout)
- `useToast.js`          — Module 5: reads ToastContext (fire a toast from
  anywhere), reusable by any future module's CRUD flows
