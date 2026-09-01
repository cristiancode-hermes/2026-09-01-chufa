# API — Chufa

Prefijo `/api`. Puerto 3081.

## Auth

- `POST /auth/register` `{ username, email, password }`
- `POST /auth/login` `{ usernameOrEmail | identifier | login, password }`
- `GET /auth/me` puntos = floor(Σ ml picked_up / 100)

## Mill / catalog

- `GET /mill/today`
- `GET /mill/:id`
- `GET|POST /mill/:id/reviews`
- `GET /sizes` → `{ items, fromPriceCents }`
- `GET /addons`

## Cart / orders

- `GET/POST/PATCH/DELETE /cart...`
- `POST /orders/checkout` `{ millDayId }` → 201 o 409 `MILL_DRY|MILL_CLOSED|ALREADY_QUEUED|NO_ADDON`
- `GET /orders` `GET /orders/:id` `POST /orders/:id/cancel` (409 `TOO_LATE`)
- `GET /orders/ticket/:code` público

## Staff / admin

- `GET /staff/queue`
- `PATCH /staff/orders/:id/status`
- `POST /staff/scan` `{ codeOrUrl }` → 409 `ALREADY_PICKED_UP|NOT_READY|NOT_FOUND`
- `PATCH /admin/mill/:id`
- `GET /admin/stats` serie 14d `{ date, litersYield, litersSold }`
