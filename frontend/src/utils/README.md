# utils/

Small, stateless helper functions and fixture/config data. Nothing here
should import React (components importing FROM here is fine).

- `constants.js`      — shared, non-secret constants: localStorage key, route
  paths, and the TechNova Electronics BRAND config (Module 4)
- `validators.js`     — client-side email/password/phone validation (mirrors
  the backend)
- `apiErrors.js`      — turns an Axios/FastAPI error into a display-ready message
- `dashboardData.js`  — Module 4: sidebar nav config + placeholder dashboard
  data (stats, system status, call statuses, recent calls, recent activity).
  Swap these fixtures for real API data in a later module.
- `customerOptions.js` — Module 5: customer status/sort dropdown options and
  the fixed page size (mirrors backend/app/schemas/customer.py)
- `productOptions.js` — Module 6: product availability/sort options and
  the client-side `computeFinalPrice` preview helper
- `knowledgeOptions.js` — Module 6: knowledge status/priority/sort options
- `callOptions.js` — Module 9: call mode/lifecycle/status options and
  formatDuration; extended in Module 10 with `CALL_STATUS_OPTIONS`
- `importOptions.js` — Module 7: import entity config, file-type/size validation,
  strategy/duplicate-handling dropdown options
