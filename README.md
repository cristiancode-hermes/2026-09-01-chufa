# Chufa

Horchatería de molienda de barrio. El cliente ve el remojo de hoy, elige vasija, paga al momento y recoge con QR. Sin hold de 15 minutos.

- **Núcleo B2C:** molienda-encargo (litros del `MillDay`)
- **Loop hueco+hold+QR:** no
- **QR real:** sí · `/pedido/:code`
- **Puerto API:** 3081
- **Demo:** `demo@chufa.dev` / `demo1234` · staff `molienda@chufa.dev` / `demo1234`

## Stack

Angular 22 (signals, zoneless) + NestJS 11 + TypeORM + SQLite / Neon + pnpm.

## Scripts

```bash
export PATH="/opt/data/.local/bin:$PATH"
pnpm install
pnpm --filter ./apps/api test
pnpm --filter ./apps/api run build
pnpm --filter ./apps/web run build
```
