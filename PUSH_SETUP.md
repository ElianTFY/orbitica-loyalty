# Orbítica Loyalty — Web Push

Orbítica puede enviar avisos directamente a los dispositivos que hayan dado permiso. Web Push funciona de forma independiente de Apple Wallet y Google Wallet.

## Qué recibe el cliente

La tarjeta web muestra un bloque **Avisos de tu tarjeta**. Cuando el cliente activa las notificaciones, Orbítica guarda únicamente la suscripción Web Push del navegador asociada a esa tarjeta.

Se envían avisos cuando:
- se agrega un sello;
- se desbloquea el premio;
- se canjea el premio;
- el negocio cambia el nombre, la meta de sellos o el premio.

## iPhone

En iPhone/iPad, Web Push se usa desde una web app agregada a la pantalla de inicio. El cliente abre la tarjeta en Safari, usa **Compartir → Agregar a pantalla de inicio**, abre el nuevo ícono y toca **Activar notificaciones**. El permiso siempre se solicita mediante una acción explícita del usuario.

## Generar llaves VAPID

El repositorio incluye un generador. Desde una PC con las dependencias del backend instaladas:

```bash
python scripts/generate_vapid.py
```

Imprime:

```text
WEB_PUSH_VAPID_PUBLIC_KEY=...
WEB_PUSH_VAPID_PRIVATE_KEY_BASE64=...
WEB_PUSH_VAPID_SUBJECT=mailto:TU_CORREO
```

La llave privada es un secreto. No copies la salida a GitHub, issues, capturas públicas ni Vercel.

## Render

Agregá únicamente al backend de Render:

```text
WEB_PUSH_ENABLED=true
WEB_PUSH_VAPID_PUBLIC_KEY=TU_LLAVE_PUBLICA
WEB_PUSH_VAPID_PRIVATE_KEY_BASE64=TU_LLAVE_PRIVADA_EN_BASE64
WEB_PUSH_VAPID_SUBJECT=mailto:TU_CORREO_DE_CONTACTO
```

Guardá y redeployá. Vercel no necesita ninguna llave Web Push: el navegador obtiene la llave pública desde el backend al abrir su tarjeta.

## Flujo técnico

1. La tarjeta registra `/sw.js`.
2. El cliente acepta el permiso del navegador.
3. El navegador crea una `PushSubscription` usando la llave VAPID pública.
4. Orbítica guarda endpoint y claves de cifrado en PostgreSQL.
5. Al acreditar un sello, el cambio se confirma primero en PostgreSQL.
6. En segundo plano se envía el Web Push y se sincronizan los Wallets configurados.
7. Si un endpoint devuelve 404/410, Orbítica lo marca inactivo para no seguir enviando a una suscripción vencida.

## Seguridad y privacidad

- Las notificaciones son opt-in.
- El cliente puede desactivarlas desde su tarjeta y también desde los ajustes del dispositivo.
- La llave VAPID privada vive solo en Render.
- El endpoint push no contiene el saldo; PostgreSQL sigue siendo la fuente de verdad.
- El fallo de un proveedor de push nunca revierte ni bloquea la acreditación de un sello.
