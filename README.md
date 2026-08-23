# Orbítica Loyalty v1.1 Hardened

Sistema SaaS de fidelización web multiempresa. Barbería Porras queda como negocio demo inicial.

## Stack

- **Frontend/BFF:** Next.js 15.5.21 + React 19.1.9 + TypeScript
- **Backend:** FastAPI + SQLAlchemy
- **Base de datos:** PostgreSQL
- **Producción propuesta:** Vercel + Render PostgreSQL/API
- **Migraciones:** Alembic

## Funciones incluidas

- Superadmin para crear negocios y dueños.
- Roles `superadmin`, `owner`, `staff`.
- Clientes separados por negocio.
- Tarjeta pública por token aleatorio de alta entropía.
- QR de registro por negocio, compatible con el mismo URL grabado en NFC.
- Sellos, canjes e historial con actor responsable.
- Dashboard y configuración de programa.
- Alta/desactivación de empleados.
- Cambio de contraseña con revocación de sesiones previas.
- Protección contra recuperación de tarjeta únicamente con el número de teléfono.

## Seguridad v1.1

La v1.1 reemplaza la seguridad de demo de la primera versión con BFF secreto, CSRF, cookies HttpOnly/Strict, JWT revocable, Argon2id, lockout/rate limits, headers, producción sin Swagger, límites de payload, secrets obligatorios y CI de seguridad.

Ver `SECURITY.md` y `DEPLOY.md` antes de publicar.

## Pruebas backend

```bash
cd backend
pip install -r requirements-dev.txt
pytest -q
```

El frontend se valida en GitHub Actions con typecheck + build una vez subido el repositorio.
