# HTTP Request Files

Manual API tests for the NestJS backend, runnable in VS Code via the [HTTPyac extension](https://marketplace.visualstudio.com/items?itemName=anweber.vscode-httpyac) or from the CLI with `httpyac`.

## Files

| File                     | Description                                                                  |
| ------------------------ | ---------------------------------------------------------------------------- |
| `healthz.http`           | GET /api/healthz                                                             |
| `catalog.http`           | GET /api/catalog                                                             |
| `auth.http`              | OAuth flow instructions + token verification                                 |
| `gift-cards.http`        | Full CRUD flow — creates a card, lists, gets, redeems (×2 idempotency check) |
| `gift-cards-errors.http` | 7 error scenarios: 401, 404, 400/422                                         |

## Setup

1. Copy `.env.example` → `.env.dev`
2. Start the API: `npm run dev:api`
3. Open [http://localhost:3000/api/auth/google](http://localhost:3000/api/auth/google) in your browser and complete the Google login

That's it — the API automatically writes your token to `requests/.env.dev` after a successful login. No copy-paste needed.

> Tokens expire after 15 minutes. Repeat step 3 to refresh.

## Running requests

**VS Code** — click the `Send Request` button above any `###` block (HTTPyac extension required).

**CLI:**

```bash
httpyac run requests/*.http --env dev
```

## Environment variables

| Variable       | Description                                        |
| -------------- | -------------------------------------------------- |
| `BASE_URL`     | API base URL (default: `http://localhost:3000`)    |
| `ACCESS_TOKEN` | JWT admin token — auto-populated after OAuth login |

## Gotchas

See [`docs/solutions/integration-issues/httpyac-status-assertion-and-response-capture-quirks.md`](../docs/solutions/integration-issues/httpyac-status-assertion-and-response-capture-quirks.md) for documented quirks:

- **`?? status X` on POST requests with a body** — the assertion line is sent as body bytes, not processed as a response assertion. Use `?? body statusCode == X` for error cases instead.
- **Variable capture in script blocks** — use `response.parsedBody` (not `requestName.response.parsedBody`). `@var = {{requestName.body.field}}` does not work for property access.
