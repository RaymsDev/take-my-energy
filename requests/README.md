requests/
.env.example ← copy to .env, fill ACCESS_TOKEN
health.http ← GET /api/health
catalog.http ← GET /api/catalog
auth.http ← OAuth instructions + token verification
gift-cards.http ← full CRUD flow, chained (creates card → gets it → redeems twice)
gift-cards-errors.http ← 7 error scenarios (401, 404, 400/422)

To use:

1. Copy requests/.env.example → requests/.env
2. Get a token: open http://localhost:3000/api/auth/google in the browser, copy access_token
3. Paste it as ACCESS_TOKEN=<token> in requests/.env
4. Run: httpyac run requests/\*.http --env requests/.env or click individual requests in VS Code with the HTTPyac extension

Push when ready: ! git push
