# QA Report — 2026-09-01 Chufa

**Project:** Horchatería de molienda — encargo de litros, cobro atómico y QR de recogida
**Stack:** Angular 22 (zoneless) + NestJS 11 + TypeORM + SQLite + pnpm
**Author:** Hermes Daily Builder
**Slug / port:** `chufa` · **3081**
**QR real:** sí · url `/pedido/:code`
**isFinalDesign:** DESIGN_FREE (proyecto nuevo)

## ✅ 1. Build Verification

| Target | Status | Details |
|--------|--------|---------|
| API `tsc --incremental false` | ✅ | `apps/api/dist/main.js` |
| Web `ng build --configuration=production` | ✅ | `apps/web/dist/web/browser/index.html` · `base href="/"` |
| pnpm workspace | ✅ | lockfile, 0 `package-lock.json` |
| Seed | ✅ | default-on (`SEED_DB !== 'false'`), demo/vecina/molinera/admin |

## ✅ 2. Test Results

**Jest:** 20/20 passing (`apps/api/src/chufa.spec.ts`)

Cubre MILL_DRY, MILL_CLOSED, ALREADY_QUEUED, NO_ADDON, ALREADY_PICKED_UP, puntos derivados, lista↔detalle, QR URL en SVG, cancel, totals.

## ✅ 3. Binary / Runtime Verification

API `http://localhost:3081` · Swagger `/api/docs` · health `{ok:true,port:3081}`

### Endpoint smoke (24/24)

| Check | Result |
|-------|--------|
| GET `/api/health` | 200 |
| GET `/api/sizes` `fromPriceCents = min(priceCents)` | 180 |
| GET `/api/mill/today` | open, litros |
| POST `/api/auth/register` | 201 `accessToken` |
| POST `/api/auth/login` email + username | 200 |
| GET `/api/auth/me` | 200 puntos derivados |
| GET `/api/auth/me` sin token | 401 |
| GET `/api/orders/ticket/XFA-DEMO01` | QR SVG contiene `qrUrl` `/pedido/` |
| Lista ↔ detalle `totalCents` | 480 = 480 |
| POST cart + checkout | 201 + QR real |
| Segundo checkout con pedido vivo | 409 `ALREADY_QUEUED` |
| Checkout 999× cubo | 409 `MILL_DRY` |
| Staff queue / milling→ready / scan | picked_up |
| Segundo scan | 409 `ALREADY_PICKED_UP` |
| Cancel paid | cancelled |
| GET `/api/admin/stats` | 14 días con `date` |
| GET `/api/account/inbox` | 200 |
| GET `/api/docs-json` | 200 |
| mill/today litros = mill/:id | 12000 |

### Browser (31/31)

Home, 390px sin overflow, figcaption completa, login vacío + demo debajo, `chufa.token`, `/molienda`, `/vasijas/vaso` (ruta 2 segmentos), carrito, `/mis-pedidos` + detalle, `/cuenta`, `/pedido/XFA-DEMO01` con SVG QR, `/entrar`, `/registro`, staff cola/scan, admin chart (ejes fechas Madrid + `<title>` tooltips, 28 barras), theme toggle, CTA primary AA.

## ✅ 4. Quality Audit

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| Capa de valor de verdad | PASS | molienda-encargo + cobro atómico + cola + QR mostrador |
| Hold 15 min / sweeper pending | PASS | no existe |
| QR real | PASS | `qrcode` SVG incluye URL absoluta |
| fromPriceCents / cero literales EUR | PASS | `eur(fromPriceCents)` / `eur(s.priceCents)` |
| 409 humano junto a `#pay-action` | PASS | `humanizeApiError` + scroll CTA |
| Auth antes de `**` | PASS | `/login` `/entrar` `/registro` `/pedido/:code` |
| Login username o email | PASS | |
| Creds demo debajo, inputs vacíos | PASS | |
| contraste-hover | PASS | `a:hover:not(.btn)`; primary hover = on-primary. Light 10.47 / hover 12.85; dark 6.47 / 8.26 |
| Chart ejes/fechas/tooltips | PASS | |
| Caption 390px | PASS | HTML figcaption, no `<text>` SVG recortado |
| PNG hero | OK | assets horta/mola/xufa (abstractos, no gym/hielo) |

### Minor Issues

| Issue | Severity | Suggestion |
|-------|----------|------------|
| Carrito vacío usa código `NO_ADDON` | baja | Código semántico propio; el CTA no se pulsa con bandeja vacía |
| `#pay-action` duplicado en error+botón | baja | **Arreglado** en QA (alert sin id duplicado) |

## ✅ 5. Security Scan

| Check | Result |
|-------|--------|
| Interceptor Bearer | PASS (`'Bearer ' + token`) |
| `***` malformado | 0 hits |
| APP_GUARD global | no |
| JWT sin token | 401 |
| `.env` gitignored | sí |

## ✅ 6. Deployment

| Target | Result | Details |
|--------|--------|---------|
| Caddy | ✅ | `chufa.proyectos.cristiancode.dev` → dist + `/api*` :3081 · HTTP 200 |
| manage-apis.sh | ✅ | 66 alineados · chufa 3081 / 2026-09-01-chufa |
| GitHub | ✅ | https://github.com/cristiancode-hermes/2026-09-01-chufa · README 200 |
| Landing | ✅ | `name:'chufa'` en proyectos-cristiancode-dev |
| Excel | ✅ | fila 98 Completado |
| Portfolio es/en/pt | ✅ | slug `chufa` · heading-251 |
| Capture config | ✅ | `tokenField: accessToken`, `loginField: identifier`, `chufa.token` |

### Enlaces

| Link | HTTP |
|------|------|
| href https://chufa.proyectos.cristiancode.dev | 200 |
| `/login` `/pedido/XFA-DEMO01` | 200 |
| link2 README | 200 |
| link3 repo | 200 |

## Summary

**OVERALL: PASS ✅**

Jest 20/20 · endpoints 24/24 · browser 31/31 · 0 incidencias graves.
Demo: `demo@chufa.dev` / `demo1234` · staff `molienda@chufa.dev` / `demo1234`.
