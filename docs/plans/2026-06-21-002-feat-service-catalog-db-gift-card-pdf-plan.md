---
title: 'feat: Service catalog in MongoDB, public service landing pages, and gift card PDF'
date: 2026-06-21
status: active
origin: docs/brainstorms/2026-06-21-service-catalog-db-and-gift-card-pdf-requirements.md
---

# feat: Service catalog in MongoDB, public service landing pages, and gift card PDF

## Summary

Move the service catalog from a static backend config into MongoDB (seeded, no admin CRUD), add a public Angular landing page at `/cadeau/service/:id` for each service, and attach a PDFKit-generated PDF — containing a QR code pointing to that landing page — to the gift card email.

---

## Problem Frame

The service catalog is hardcoded in `apps/api/src/catalog/catalog.config.ts`. Gift card recipients receive an HTML email with a code but no visual artifact and no direct path to learn about their service. Moving the catalog to MongoDB makes services API-first; dedicated landing pages give QR codes a meaningful destination; the PDF attachment makes the gift feel tangible and complete.

_(see origin: docs/brainstorms/2026-06-21-service-catalog-db-and-gift-card-pdf-requirements.md)_

---

## Key Technical Decisions

- **Mongoose schema mirrors `CatalogService` interface.** The shared `CatalogService` interface in `libs/shared/interfaces` is the source of truth. The Mongoose `@Prop()` fields map 1:1, avoiding divergence. The `id` field (string) is stored as a regular Prop with a `unique` index — not as the Mongo `_id` — so that the stable IDs `'1'`–`'9'` can be used directly in frontend routes without ObjectId conversion.

- **`CatalogRegistryService` methods become async.** `findAll()` and `findById()` switch from sync array access to async Mongoose queries. The only consumer of `findById()` is `GiftCardsService.create()` — that `await` addition is the only propagation needed.

- **`serviceId` flows through the creation pipeline without a schema change.** `GiftCardsService.create()` already holds `service.id` after the `findById()` call. Rather than storing `serviceId` on the gift card document, it is passed directly to `PdfService.generateGiftCardPdf()` and `EmailService.sendGiftCard()` in that same method. No Mongoose schema migration required.

- **PDFKit for PDF generation; `qrcode` for QR data.** `pdfkit` draws the page programmatically (no headless browser, no extra process). `qrcode` generates a PNG `Buffer` that PDFKit embeds as an image. Both return synchronous or promise-based results that compose cleanly in the NestJS async context. `FRONTEND_URL` env var provides the base URL for the QR code target.

- **PDF generation failure is non-blocking.** The card is persisted first. PDF generation and email delivery are both wrapped in a try/catch that logs and continues — consistent with the existing email-failure pattern in `GiftCardsService.create()`.

- **Public landing page fetches from `GET /catalog/:id`.** No auth guard on the catalog controller (already ungated). The Angular component uses `HttpClient` and signals, matching the pattern in `CreateGiftCardPageComponent`. The `getServiceById()` method is added to `GiftCardsApiService` rather than creating a new service, keeping the API surface unified.

---

## Requirements Traceability

| Plan unit | Requirements                 |
| --------- | ---------------------------- |
| U1        | R1.1                         |
| U2        | R1.2, R1.4, R1.5             |
| U3        | R1.3, R1.6                   |
| U4        | R3.1, R3.2, R3.3, R3.4, R3.5 |
| U5        | R3.6, R3.7                   |
| U6        | R2.1, R2.2, R2.3, R2.4, R2.5 |

---

## High-Level Technical Design

### Gift card creation flow with PDF attachment

```
Admin: POST /api/gift-cards
  │
  ▼
GiftCardsService.create(dto)
  ├─ await catalogRegistry.findById(dto.serviceId)  → CatalogServiceDocument
  ├─ giftCardModel.create(...)                       → GiftCardDocument (persisted)
  ├─ try:
  │    qrUrl = `${FRONTEND_URL}/cadeau/service/${service.id}`
  │    pdfBuffer = await pdfService.generateGiftCardPdf({ ..., qrUrl })
  │    await emailService.sendGiftCard({ ..., pdfBuffer })
  └─ catch → log, continue (non-blocking)
```

### Data flow: catalog ID through to QR code URL

```
catalog.id ('1') ─────────────────────────────────────────────────────┐
                                                                        │
GET /cadeau/service/1 (Angular) ──► GET /api/catalog/1 (NestJS) ◄──── QR code encodes this URL
                                        │
                                        ▼
                                CatalogServiceDocument { id: '1', title, price, ... }
```

### Catalog module wiring

```
CatalogModule
  imports:  MongooseModule.forFeature([CatalogServiceModel])
  provides: CatalogRegistryService
  exports:  CatalogRegistryService   (consumed by GiftCardsModule)

AppModule
  imports:  [..., CatalogModule, PdfModule, ...]
```

---

## Implementation Units

### U1. Catalog Mongoose schema

**Goal:** Define the Mongoose document schema for catalog services, mirroring the existing `CatalogService` interface.

**Requirements:** R1.1

**Dependencies:** none

**Files:**

- `apps/api/src/catalog/schemas/catalog-service.schema.ts` (create)
- `apps/api/src/catalog/catalog.module.ts` (modify — add `MongooseModule.forFeature`)

**Approach:** Follow the pattern in `apps/api/src/gift-cards/schemas/gift-card.schema.ts`. Decorate a class with `@Schema()`, define `@Prop()` fields matching the `CatalogService` interface (`id: string` with `{ required: true, unique: true }`, `title`, `price`, `currency`, `duration` as a nested object). Export `CatalogServiceDocument = HydratedDocument<CatalogServiceModel>` and the factory. In `CatalogModule`, import `MongooseModule.forFeature([{ name: CatalogServiceModel.name, schema: CatalogServiceSchema }])`.

**Patterns to follow:** `apps/api/src/gift-cards/schemas/gift-card.schema.ts`, `apps/api/src/gift-cards/gift-cards.module.ts`

**Test scenarios:**

- `Test expectation: none` — this unit is pure schema/wiring with no behavioral surface to unit test. Schema correctness is validated when U2 query tests run against the wired module.

**Verification:** `CatalogModule` compiles without errors. `CatalogServiceModel.name` resolves in the module context.

---

### U2. CatalogRegistryService async queries + GET /catalog/:id

**Goal:** Make `CatalogRegistryService` read from MongoDB, and expose a single-service endpoint.

**Requirements:** R1.2, R1.4, R1.5

**Dependencies:** U1

**Files:**

- `apps/api/src/catalog/catalog.service.ts` (modify)
- `apps/api/src/catalog/catalog.controller.ts` (modify — add `findOne`)
- `apps/api/src/catalog/catalog.controller.spec.ts` (modify)
- `apps/api/src/gift-cards/gift-cards.service.ts` (modify — `await findById`)
- `apps/api/src/gift-cards/gift-cards.service.spec.ts` (modify — mock async)

**Approach:**

- Inject `@InjectModel(CatalogServiceModel.name) private readonly model: Model<CatalogServiceDocument>` into `CatalogRegistryService`.
- `findAll()` → `return this.model.find().lean().exec()` (returns `Promise<CatalogService[]>`).
- `findById(id)` → `return this.model.findOne({ id }).lean().exec()` (returns `Promise<CatalogServiceDocument | null>`).
- `CatalogController.findAll()` becomes `async` returning the promise.
- Add `@Get(':id')` handler `findOne(@Param('id') id: string)` that calls `findById(id)` and throws `NotFoundException` when null.
- No `@UseGuards()` — endpoint stays public.
- In `GiftCardsService.create()`, change `const service = this.catalogRegistry.findById(dto.serviceId)` to `const service = await this.catalogRegistry.findById(dto.serviceId)`.

**Patterns to follow:** `apps/api/src/catalog/catalog.controller.spec.ts` (existing test structure), `apps/api/src/gift-cards/gift-cards.service.spec.ts` (model mock pattern)

**Test scenarios:**

- `findAll()` returns a mocked array of services from the model.
- `findById('1')` calls `model.findOne({ id: '1' })` and returns the document.
- `findById('nonexistent')` returns null and the controller handler throws `NotFoundException`.
- `GET /catalog` (controller test) returns the full service array.
- `GET /catalog/1` (controller test) returns the matching service.
- `GET /catalog/nonexistent` (controller test) responds with 404.
- `GiftCardsService.create()` with an unknown serviceId still throws `NotFoundException` (async path).

**Verification:** All catalog spec tests pass. Gift card service spec tests pass with async mock. `npm exec nx test api` green.

---

### U3. Catalog seed script

**Goal:** Idempotently insert the 9 existing services into MongoDB so the catalog is populated from the first deployment.

**Requirements:** R1.3, R1.6

**Dependencies:** U1, U2

**Files:**

- `apps/api/src/catalog/catalog.seed.ts` (create)
- `apps/api/src/catalog/catalog.config.ts` (modify — remove `CATALOG_SERVICES` array after seed is verified)

**Approach:** The seed script bootstraps a minimal NestJS context (or uses Mongoose directly), iterates the 9 service objects (copied from the current `CATALOG_SERVICES` array), and calls `model.updateOne({ id }, service, { upsert: true })` for each. Running it multiple times is safe — upsert on `id` is idempotent. The script is a standalone Node entry point runnable with `ts-node` or via an npm script (`seed:catalog`). After the script is in place and verified, the static `CATALOG_SERVICES` array in `catalog.config.ts` is removed; if `catalog.config.ts` becomes empty, the file is deleted.

**Patterns to follow:** Common NestJS seed pattern — `NestFactory.createApplicationContext()` with `AppModule`, get `CatalogRegistryService` or the model directly, upsert, then `await app.close()`.

**Test scenarios:**

- `Test expectation: none` — the seed script is a one-shot operational tool. Its correctness is verified by running it against the dev database and then calling `GET /catalog` to confirm the 9 services appear.

**Verification:** Running the seed script against a local MongoDB populates 9 documents. Re-running it does not create duplicates. `GET /api/catalog` returns all 9 services.

---

### U4. PdfService with PDFKit and QR code generation

**Goal:** Implement a NestJS service that generates a gift-card PDF buffer, containing service name, recipient/sender names, the gift code, and an embedded QR code image.

**Requirements:** R3.1, R3.2, R3.3, R3.4, R3.5

**Dependencies:** none (can be built in parallel with U1–U3)

**Files:**

- `apps/api/src/pdf/pdf.service.ts` (create)
- `apps/api/src/pdf/pdf.module.ts` (create)
- `apps/api/src/pdf/pdf.service.spec.ts` (create)
- `apps/api/src/app/app.module.ts` (modify — import `PdfModule`)
- `package.json` (modify — add `pdfkit`, `@types/pdfkit`, `qrcode`, `@types/qrcode`)

**Approach:**

- `PdfService.generateGiftCardPdf(params: { serviceName, recipientName, senderName, code, qrUrl })` returns `Promise<Buffer>`.
- Use `qrcode.toBuffer(params.qrUrl, { type: 'png' })` to generate a PNG buffer.
- Instantiate a `PDFDocument`, pipe it to a `PassThrough` stream, collect chunks into a `Buffer`.
- Layout: logo or header text ("Cinq de Cœur"), service name in large font, recipient/sender names, gift code in monospace, QR code image via `doc.image(qrBuffer, ...)`.
- All text in French (e.g., "Prestation :", "Code cadeau :", "Scannez pour découvrir votre soin").
- `FRONTEND_URL` is read via `ConfigService` in `GiftCardsService` (not in `PdfService`) — the URL is passed in as `qrUrl`. This keeps `PdfService` testable without config injection.
- `PdfModule` is a simple `@Module({ providers: [PdfService], exports: [PdfService] })`.

**Technical design (directional):**

```
generateGiftCardPdf(params):
  qrBuffer = await qrcode.toBuffer(params.qrUrl, { type: 'png', width: 150 })
  doc = new PDFDocument({ size: 'A5', margin: 40 })
  chunks = []
  doc.on('data', chunk => chunks.push(chunk))
  await new Promise(resolve => doc.on('end', resolve))
  // draw: header, serviceName, recipientName, senderName, code, qrBuffer image
  doc.end()
  return Buffer.concat(chunks)
```

**Patterns to follow:** Node.js stream-to-buffer pattern; `email.service.spec.ts` for mock-injection style.

**Test scenarios:**

- `generateGiftCardPdf(validParams)` resolves to a `Buffer` with `length > 0`.
- The returned buffer starts with `%PDF` (PDF magic bytes).
- Mock `qrcode.toBuffer` to return a known PNG buffer; verify it was called with the correct URL.
- When `qrcode.toBuffer` rejects, `generateGiftCardPdf` propagates the error.

**Verification:** Unit tests pass. `npm exec nx test api` green. A manual smoke test (save buffer to a `.pdf` file and open it) shows all fields and a scannable QR code.

---

### U5. Wire PDF into gift card creation and email attachment

**Goal:** Call `PdfService` during gift card creation and attach the resulting PDF to the Resend email.

**Requirements:** R3.6, R3.7

**Dependencies:** U2, U4

**Files:**

- `apps/api/src/gift-cards/gift-cards.service.ts` (modify)
- `apps/api/src/gift-cards/gift-cards.module.ts` (modify — import `PdfModule`)
- `apps/api/src/email/email.service.ts` (modify — add optional `pdfBuffer` param)
- `.env.example` (modify — add `FRONTEND_URL=`)

**Approach:**

- In `GiftCardsService.create()`, after persisting the card:
  ```
  const qrUrl = `${this.config.get('FRONTEND_URL')}/cadeau/service/${service.id}`
  try {
    const pdfBuffer = await this.pdfService.generateGiftCardPdf({ ..., qrUrl })
    await this.emailService.sendGiftCard({ ..., pdfBuffer })
  } catch (err) {
    this.logger.error('Gift card PDF/email delivery failed', { code, error: err })
  }
  ```
- Inject `PdfService` and `ConfigService` into `GiftCardsService`. `ConfigService` is already available via `ConfigModule.forRoot({ isGlobal: true })`.
- In `EmailService.sendGiftCard()`, add `pdfBuffer?: Buffer` to the params interface. When present, add `attachments: [{ filename: 'carte-cadeau.pdf', content: pdfBuffer }]` to the Resend `emails.send()` call.
- Add `FRONTEND_URL=` to `.env.example` with a comment.

**Patterns to follow:** Existing try/catch block in `GiftCardsService.create()` for email failure handling; `email.service.ts` Resend call structure.

**Test scenarios:**

- `GiftCardsService.create()` calls `pdfService.generateGiftCardPdf` with `qrUrl` containing the service ID.
- `GiftCardsService.create()` calls `emailService.sendGiftCard` with a `pdfBuffer` argument.
- When `pdfService.generateGiftCardPdf` throws, the gift card is still persisted and the error is logged (not re-thrown).
- When `emailService.sendGiftCard` throws, the gift card is still persisted and the error is logged.
- `EmailService.sendGiftCard()` with a non-null `pdfBuffer` includes `attachments` in the Resend call.
- `EmailService.sendGiftCard()` with no `pdfBuffer` does NOT include `attachments` in the Resend call.

**Verification:** `npm exec nx test api` green. In a local end-to-end smoke test, creating a gift card via the admin UI results in an email with a PDF attachment containing a visible QR code.

---

### U6. Public service landing page (`/cadeau/service/:id`)

**Goal:** Add a public, unauthenticated Angular page that displays a welcoming gift card message and the service details fetched from the catalog API.

**Requirements:** R2.1, R2.2, R2.3, R2.4, R2.5

**Dependencies:** U2 (the `GET /catalog/:id` endpoint must exist)

**Files:**

- `apps/fiveOfHeart/src/app/pages/gift-card-service-page/gift-card-service-page.component.ts` (create)
- `apps/fiveOfHeart/src/app/pages/gift-card-service-page/gift-card-service-page.component.html` (create)
- `apps/fiveOfHeart/src/app/pages/gift-card-service-page/gift-card-service-page.component.scss` (create)
- `apps/fiveOfHeart/src/app/services/gift-cards-api.service.ts` (modify — add `getServiceById`)
- `apps/fiveOfHeart/src/app/app.routes.ts` (modify — add `/cadeau/service/:id` lazy-loaded route)

**Approach:**

- Add `getServiceById(id: string): Observable<CatalogService>` to `GiftCardsApiService`, calling `GET /api/catalog/:id`.
- New lazy-loaded route: `{ path: 'cadeau/service/:id', loadComponent: () => import(...).then(m => m.GiftCardServicePageComponent) }`. No guard — fully public.
- Component uses signals: `service = signal<CatalogService | null>(null)`, `loading = signal(true)`, `error = signal(false)`.
- In `ngOnInit`, subscribe to `getServiceById(id)`. On success, set `service`; on 404/error, set `error`.
- Template (French): welcoming headline ("Un cadeau vous a été offert !"), service card showing name, duration, price, a message block ("Ce soin vous est offert. Prenez rendez-vous pour en profiter."), and a booking CTA linking to `SITE_CONFIG['BOOKING']`.
- Error state: "Ce soin n'a pas pu être trouvé. Vérifiez le lien ou contactez-nous."
- Loading state: standard spinner or skeleton.

**Patterns to follow:**

- `apps/fiveOfHeart/src/app/pages/massage-details-page/massage-details-page.component.ts` — route param subscription pattern.
- `apps/fiveOfHeart/src/app/pages/admin-page/gift-cards/create/create-gift-card-page.component.ts` — signal pattern, API service injection.
- `apps/fiveOfHeart/src/app/app.routes.ts` — existing lazy-loaded route declarations.

**Test scenarios:**

- Component loads with a valid `:id`, calls `getServiceById`, and renders the service name in the DOM.
- Component shows the loading state while the observable is pending.
- Component shows the error state when the API returns 404 or a network error.
- `getServiceById('1')` calls `HttpClient.get` with `/api/catalog/1`.
- The booking CTA link uses the `SITE_CONFIG['BOOKING']` URL.

**Verification:** Navigating to `/cadeau/service/1` in a local dev server renders the service page with correct title, duration, price, and booking link. Navigating to `/cadeau/service/nonexistent` shows the error state.

---

## Scope Boundaries

### Deferred to Follow-Up Work

- Admin UI for creating, editing, or deleting services (tracked as a future enhancement).
- Per-service booking URLs on the landing page — the catalog schema does not store `bookingUrl`; the page uses the global booking URL from `SITE_CONFIG`.
- Service images on the landing page — editorial content lives in `massages.json` under a different slug structure; bridging the two is a separate task.
- A `slug` field on the `CatalogService` interface (noted in R4.1 of the brainstorm as optional, deferred).

### Out of Scope

- Changes to the existing `massage/:type` editorial pages.
- Stripe/payment integration.
- Gift card expiry or partial redemption.

---

## Risks & Dependencies

| Risk                                                      | Likelihood | Mitigation                                                                                                       |
| --------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| PDFKit stream-to-buffer timing issues                     | Low        | Use a `Promise` around the `end` event as the canonical pattern; test with the spec                              |
| Resend `attachments` field may differ across SDK versions | Low        | Check `resend@6.x` docs — `attachments: [{ filename, content }]` is the stable interface                         |
| Catalog `findAll()` returning 0 items before seed runs    | Medium     | Seed script is part of deployment runbook; `GET /catalog` returning `[]` is a valid (graceful) state             |
| `FRONTEND_URL` missing in production                      | Medium     | Add to `.env.example` and deployment config (Render `render.yaml` or Vercel env); log a startup warning if unset |

---

## Open Questions

- **Deployment env var**: `FRONTEND_URL` must be set in the Render API service environment. Confirm the value (`https://cinqdecoeur.fr`) before deploying.
- **Seed execution timing**: The seed script needs to run once after the MongoDB migration to a collections-backed catalog. Manual step; add to deployment notes.

---

## Sources & Research

- Brainstorm origin: `docs/brainstorms/2026-06-21-service-catalog-db-and-gift-card-pdf-requirements.md`
- Previous backend plan: `docs/plans/2026-05-30-001-feat-nestjs-backend-gift-cards-plan.md`
- Mongoose schema pattern: `apps/api/src/gift-cards/schemas/gift-card.schema.ts`
- Angular signal + API pattern: `apps/fiveOfHeart/src/app/pages/admin-page/gift-cards/create/create-gift-card-page.component.ts`
- Email service (Resend): `apps/api/src/email/email.service.ts`
- External research: not run — local patterns are sufficient for all three feature areas. PDFKit and qrcode are well-established Node.js libraries with stable APIs.
