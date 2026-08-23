# Seguridad — Orbítica Loyalty v1.1

Esta versión está endurecida para un primer despliegue real, pero ningún sistema conectado a Internet es “invulnerable”. La seguridad depende también de las cuentas de GitHub, Vercel, Render, del dominio y de las credenciales operativas.

## Controles incluidos

- Repositorio preparado para ser privado y `.gitignore` estricto para secretos, llaves y archivos `.env`.
- Contraseñas con Argon2id, mínimo 12 caracteres y política de complejidad para nuevas cuentas.
- JWT de vida limitada, con issuer, audience, jti y `token_version` para revocación inmediata al cambiar contraseña.
- Cookie de sesión `HttpOnly`, `Secure` en producción y `SameSite=Strict`.
- Patrón BFF: el navegador no conoce el token JWT ni `BFF_SHARED_SECRET`.
- Endpoints de autenticación/admin ocultos detrás de un secreto servidor-a-servidor entre Vercel y FastAPI.
- Protección CSRF para operaciones autenticadas.
- Rate limiting de bajo costo en login, registro, tarjetas públicas y escrituras administrativas.
- Bloqueo temporal de cuenta tras intentos fallidos repetidos.
- Swagger/OpenAPI desactivados automáticamente en producción.
- Headers de seguridad y CSP en Next.js; headers defensivos adicionales en FastAPI.
- Límite de tamaño de body en el BFF para reducir abuso de memoria.
- El registro repetido con un teléfono existente ya no devuelve ni modifica el token de la tarjeta.
- Índices compuestos para panel y actividad, manteniendo rapidez al crecer los datos.
- Migraciones Alembic y pruebas automatizadas.
- GitHub Actions con tests, build y auditoría de dependencias; Dependabot semanal.

## Dependencias web (estado al 22 de agosto de 2026)

- El proyecto fija Next.js `15.5.21` (Maintenance LTS) y React/React DOM `19.1.9`, en lugar de la versión 15.4.6 original.
- GitHub Actions ejecuta `npm audit` y Dependabot revisa actualizaciones semanalmente.
- Next.js anunció otra publicación de seguridad para el **26 de agosto de 2026**. Antes de habilitar datos reales después de esa fecha, actualizá a la nueva versión 15.5.x parcheada y exigí CI en verde.

## Reglas operativas

1. GitHub debe ser **Private**.
2. Activá 2FA en GitHub, Vercel y Render.
3. Nunca pegues secretos en código, commits, capturas, tickets o chats públicos.
4. `JWT_SECRET` y `BFF_SHARED_SECRET` deben ser diferentes.
5. Usá contraseñas únicas para superadmin y dueños.
6. Si un secreto se filtra, rotalo inmediatamente y vuelve a desplegar.
7. Hacé backups de PostgreSQL antes de cambios importantes.
8. No abras el acceso público directo a la base de datos salvo necesidad puntual.
9. Revisá las alertas de Dependabot/GitHub Actions antes de cada release.
10. Antes de almacenar datos más sensibles o pagos, hacé una auditoría externa y agregá observabilidad centralizada/alertas.

## Rendimiento

El rate limiting inicial es en memoria por worker para no añadir Redis ni un salto de red a cada request. Es apropiado para la primera instancia. Si más adelante se escala a varias instancias de API, conviene mover el límite exterior a Cloudflare o Redis/Upstash. El pool PostgreSQL está acotado para evitar agotar conexiones.
