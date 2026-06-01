---
title: 'HTTPyac quirks: ?? status sent as POST body; variable capture via response.parsedBody'
date: 2026-06-01
category: docs/solutions/integration-issues
module: api-testing
problem_type: integration_issue
component: tooling
severity: medium
symptoms:
  - 'POST request Content-Length header is larger than the JSON body — the extra bytes are the `?? status X` assertion line'
  - "Server returns 400 Bad Request with 'Unexpected non-whitespace character after JSON at position N (line 9 column 1)'"
  - 'The character at that position is always `?` — the first character of `?? status`'
  - '`@var = {{requestName.body.field}}` syntax leaves the variable undefined — treated as a literal name lookup'
  - "TypeError: Cannot read properties of undefined (reading 'parsedBody') when using requestName.response in a script block"
root_cause: wrong_api
resolution_type: code_fix
tags:
  - httpyac
  - http-client
  - assertions
  - variable-capture
  - post-body
  - nestjs
  - integration-testing
---

# HTTPyac quirks: `?? status` sent as POST body; variable capture via `response.parsedBody`

## Problem

Two related HTTPyac quirks cause silent failures in `.http` request files. First, `?? status X` assertion lines are appended to the request body bytes of POST requests that include a JSON body, making the body invalid JSON. Second, the `@var = {{requestName.body.field}}` shorthand and `requestName.response.parsedBody` in script blocks do not work for response value capture — the correct API is `response.parsedBody` inside a `{{ }}` block.

## Symptoms

- POST request `Content-Length` header is larger than the actual JSON body. The extra bytes equal the `?? status X` line (e.g., `?? status 201` = 14 bytes including `\n`).
- Server returns `400 Bad Request` with message: `Unexpected non-whitespace character after JSON at position N (line 9 column 1)`. Line 9 (with blank line) or line 8 (without) is the `?` character of `?? status`.
- `@cardId = {{createCard.body._id}}` leaves `cardId` undefined. Error: `variable createCard.body._id not defined`.
- `createCard.response.parsedBody._id` inside a `{{ }}` block throws: `TypeError: Cannot read properties of undefined (reading 'parsedBody')`.
- Downstream requests that depend on the captured variable fail with `ReferenceError: cardId is not defined`.

## What Didn't Work

**Attempts to fix `?? status` body inclusion:**

- Removing the blank line between `}` and `?? status 201` — error moved from position 174 to 173 (one byte fewer); `?? status` was still sent as body.
- Adding `###` before the first request block — no effect; the assertion was still included in body bytes.
- Reordering so `?? body prop == value` came before `?? status X` — httpyac still sent `?? status` as body regardless of order.
- Wrapping the assertion in quotes or using `?? status == 201` syntax — same behavior.

**Attempts to fix variable capture:**

- `@cardId = {{createCard.body._id}}` — httpyac treats the entire `createCard.body._id` string as a variable name, not as property access. Returns undefined.
- `exports.cardId = createCard.response.parsedBody._id` in a `{{ }}` block — `createCard.response` is `undefined` inside a script block's execution context.

**Assertion syntax iterations (discovered separately):**

- `?? body $.status == ok` — `$` resolves to undefined; `ok` resolves as a variable reference (also undefined).
- `?? body $.status == "ok"` — same `$`-is-undefined problem.
- `?? body status == "ok"` (quoted value) — assertion parse failure.
- Working form: `?? body status == ok` (no `$` prefix, no quotes around the expected value).

## Solution

### Fix 1: Replace `?? status` on POST requests with body assertions

Remove `?? status X` from any request block that has a body. Use `?? body statusCode == X` for error response testing instead — NestJS (and most frameworks) include `"statusCode"` in the error response body.

**Before (broken):**

```http
###
POST {{BASE_URL}}/api/gift-cards
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "recipientName": "Alice",
  "serviceId": "1"
}

?? status 201
?? body status == active
```

**After (working):**

```http
###
POST {{BASE_URL}}/api/gift-cards
Authorization: Bearer {{ACCESS_TOKEN}}
Content-Type: application/json

{
  "recipientName": "Alice",
  "serviceId": "1"
}

?? body status == active
?? body code != null
```

For error response status checks:

```http
###
# 401 — missing Authorization header
POST {{BASE_URL}}/api/gift-cards
Content-Type: application/json

{ "recipientName": "Alice", "serviceId": "1" }

?? body statusCode == 401
```

`?? status X` works correctly on GET, PATCH, DELETE requests that have no body.

### Fix 2: Capture response fields with `response.parsedBody` in a script block

Replace `@var = {{requestName.body.field}}` or `requestName.response.parsedBody` with the `response` variable inside the same request's `{{ }}` block.

**Before (broken):**

```http
###
# @name createCard
POST {{BASE_URL}}/api/gift-cards
Content-Type: application/json

{ ... }

@cardId = {{createCard.body._id}}
```

**Also broken:**

```http
{{
  exports.cardId = createCard.response.parsedBody._id;
}}
```

**After (working):**

```http
###
# @name createCard
POST {{BASE_URL}}/api/gift-cards
Content-Type: application/json

{ ... }

?? body status == active
{{
  exports.cardId = response.parsedBody._id;
}}
```

`response` in a `{{ }}` block always refers to the current request's response. `exports.varName` makes the value available as `{{varName}}` in all subsequent requests within the same file run.

### Fix 3: Run all regions with `--all`

For chained requests (where a captured variable from request A is used in request B), all regions must run sequentially. Add `--all` to the CLI command:

```json
"test:http": "httpyac run requests/*.http --env dev --all"
```

Without `--all`, httpyac prompts which region to run and only executes one, leaving captured variables undefined for downstream requests.

## Why This Works

**`?? status` body inclusion:** HTTPyac's request block parser does not recognize `?? status` lines as assertion terminators when they follow a request body. The parser includes everything between the headers blank line and the next `###` separator as body content, except for `?? body` lines (which it does correctly strip). This is an asymmetry in the httpyac v6 parser — `?? body` is handled but `?? status` is not.

The diagnostic signal is the `Content-Length` header: for a 172-byte JSON body, `Content-Length: 187` = 172 + 1 (blank line) + 14 (`?? status 201\n`). The server's error "line 9 column 1" maps exactly to the `?` character of `?? status 201` when counting lines from the JSON body start.

**Variable capture:** In httpyac `{{ }}` script blocks, `response` is a local binding for the current request's response object. Named request references (`createCard`) do not expose a `.response` property in this context. The `@var = {{expr}}` shorthand performs variable substitution (looking up `expr` as a variable name), not JavaScript expression evaluation.

## Prevention

- **Never place `?? status X` after a request body.** For success cases, omit status assertions and rely on `?? body` field assertions (which implicitly confirm a non-error response). For error cases, assert on `?? body statusCode == X`.
- **Always use `response.parsedBody` in script blocks** for capturing values from the current response.
- **Add `--all` to `httpyac run`** in CI and `package.json` test scripts to ensure chained requests run in sequence.
- **Verify `Content-Length`** in httpyac request logs when debugging unexpected 400 errors on POST requests — an inflated value indicates assertion lines are leaking into the body.

## Related

- `requests/gift-cards.http` — the fixed request file showing the working patterns
- `requests/gift-cards-errors.http` — error-case assertions using `?? body statusCode == X`
- `requests/httpyac.config.js` — responseLogging hook for redacting Authorization headers in logs
