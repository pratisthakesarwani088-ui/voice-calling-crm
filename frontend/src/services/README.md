# services/

All backend communication goes through here — never call `axios`
directly from a component.

- `apiClient.js`    — shared Axios instance; attaches the stored JWT to
  every request automatically
- `healthService.js` — Module 1 backend health check
- `authService.js`   — Module 3 register/login/logout/me calls
- `customerService.js` — Module 5 Customer Management CRUD + list/search/
  filter/sort/pagination calls
- `productService.js` — Module 6 Product Management CRUD/list calls
- `knowledgeService.js` — Module 6 Knowledge Base CRUD/list calls
- `importService.js` — Module 7 preview/import/template-download calls
- `aiService.js` — Module 8 AI Assistant call
- `callService.js` — Module 9 start/status/end/list calls; extended in
  Module 10 with search/filter/paginate (`listCalls`) and `deleteCall`
- `reportService.js` — Module 10 dashboard statistics and chart data calls
