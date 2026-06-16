---
title: "Mongoose findOneAndUpdate `new` option deprecated — use `returnDocument: 'after'`"
date: 2026-06-16
category: docs/solutions/runtime-errors
module: gift-cards
problem_type: runtime_error
component: service_object
severity: low
symptoms:
  - 'Mongoose emits runtime warning: [MONGOOSE] Warning: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated'
  - 'Warning surfaces at runtime during gift card redemption, not at build or test time'
  - 'Mock-based unit tests do not catch this — they are option-agnostic'
root_cause: wrong_api
resolution_type: code_fix
related_components:
  - gift-cards
tags:
  - mongoose
  - mongoose-8
  - deprecated-api
  - find-one-and-update
  - return-document
  - runtime-warning
  - nestjs
---

# Mongoose findOneAndUpdate `new` option deprecated — use `returnDocument: 'after'`

## Problem

When calling `findOneAndUpdate()` or `findOneAndReplace()` via Mongoose 8.x, passing `{ new: true }` in the options object triggers a deprecation warning at runtime. The `new` option was a legacy alias from Mongoose 3.x and has been removed in favour of the official MongoDB driver option name `returnDocument: 'after'`.

## Symptoms

The following warning appears in the NestJS server log whenever the affected endpoint is hit:

```
(node:27673) [MONGOOSE] Warning: mongoose: the `new` option for `findOneAndUpdate()` and `findOneAndReplace()` is deprecated. Use `returnDocument: 'after'` instead.
```

No test failures accompany this warning — mock-based unit tests are option-agnostic and do not surface it.

## What Didn't Work

The fix was direct. No failed investigation paths were taken. The warning message itself names the replacement option precisely.

## Solution

In `apps/api/src/gift-cards/gift-cards.service.ts`, inside `redeemGiftCard`, replace `{ new: true }` with `{ returnDocument: 'after' }`:

**Before:**

```typescript
const updated = await this.giftCardModel.findOneAndUpdate({ _id: id, status: 'active' }, { status: 'redeemed', redeemedAt: new Date() }, { new: true }).exec();
```

**After:**

```typescript
const updated = await this.giftCardModel.findOneAndUpdate({ _id: id, status: 'active' }, { status: 'redeemed', redeemedAt: new Date() }, { returnDocument: 'after' }).exec();
```

One-line change. All 47 existing tests passed without modification.

## Why This Works

`new: true` was a Mongoose 3.x-era convenience alias meaning "return the document as it looks after the update, not before." Mongoose 8.x dropped this alias to align with the official MongoDB Node.js driver, which uses `returnDocument` with string values `'before'` (default) or `'after'`. Passing `{ returnDocument: 'after' }` is the semantically identical, driver-native replacement.

## Prevention

**Grep audit** — run this across the service layer to find all remaining occurrences before they surface at runtime:

```bash
grep -rn "new: true" apps/api/src --include="*.ts"
```

Any hit inside a `findOneAndUpdate` or `findOneAndReplace` call is a candidate for migration.

**Shared constant** — consider a repo-wide helper to ensure the pattern is never re-introduced:

```typescript
export const RETURN_UPDATED = { returnDocument: 'after' } as const;
```

**Test assertions** — unit tests that mock Mongoose should assert the exact options object passed to `findOneAndUpdate`, making any regression visible before runtime:

```typescript
expect(mockModel.findOneAndUpdate).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), { returnDocument: 'after' });
```

## Related Issues

- None found in this repository.
