# Architecture — Chufa

Monorepo `apps/api` (NestJS) + `apps/web` (Angular 22). El valor está en el remojo del día: `MillDay.litersRemaining` se descuenta en un checkout atómico. No hay `expiresAt` ni sweeper.

Decision Record: `Núcleo B2C: otro (molienda-encargo)` · `Loop hueco+hold+QR: no` · `QR real: sí | url: /pedido/:code`.

## Módulos API

- auth — JWT, username o email
- mill — today, reviews, admin patch, stats 14d
- catalog — sizes + addons
- cart — líneas size/addon
- orders — checkout mutex + FOR UPDATE, ticket público, cancel
- staff — cola + scan
- seed — demo con puntos derivados

## Frontend

Auth routes (`/login`, `/entrar`, `/registro`) y `/pedido/:code` van antes del shell `**`. Token `chufa.token`. Interceptor lee localStorage, no AuthService.
