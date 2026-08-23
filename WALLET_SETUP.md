# Orbítica Loyalty — Apple Wallet + Google Wallet

La aplicación incluye botones para agregar la tarjeta del cliente a Apple Wallet y Google Wallet y sincroniza el saldo cuando el negocio agrega sellos, canjea un premio o cambia el programa. Las credenciales se guardan únicamente en Render.

## Apple Wallet

### 1. Requisitos
- Membresía activa de Apple Developer.
- Un Pass Type ID propio de Orbítica.
- Un certificado Pass Type ID y su llave privada.
- El certificado intermedio WWDR correspondiente.
- Una URL HTTPS pública para el backend.

### 2. Crear Pass Type ID
En Apple Developer → Certificates, Identifiers & Profiles → Identifiers → + → Pass Type IDs.
Ejemplo recomendado:

`pass.com.orbiticastudio.loyalty`

Guardá exactamente ese valor para `APPLE_PASS_TYPE_IDENTIFIER`.

### 3. Crear CSR y llave privada
Con OpenSSL:

```bash
openssl req -new -newkey rsa:2048 -nodes -keyout wallet.key -out wallet.certSigningRequest -subj "/CN=Orbita Wallet/O=Orbita Studio/C=CR"
```

No subas `wallet.key` a GitHub.

### 4. Crear certificado Pass Type ID
Apple Developer → Certificates → + → Pass Type ID Certificate. Seleccioná el Pass Type ID y subí `wallet.certSigningRequest`. Descargá el `.cer`.

Convertí el certificado y generá P12:

```bash
openssl x509 -inform DER -in pass.cer -out pass.pem
openssl pkcs12 -export -inkey wallet.key -in pass.pem -out wallet.p12
```

Usá una contraseña fuerte para el P12.

### 5. WWDR
Descargá el certificado WWDR intermedio vigente para Pass Type ID desde Apple PKI/Apple Developer. Convertí a PEM:

```bash
openssl x509 -inform DER -in AppleWWDRCAG4.cer -out wwdr.pem
```

### 6. Team ID
Copiá tu Apple Team ID desde la cuenta Apple Developer.

### 7. Convertir archivos a Base64 en PowerShell

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("wallet.p12"))
[Convert]::ToBase64String([IO.File]::ReadAllBytes("wwdr.pem"))
```

### 8. Variables en Render

```text
PUBLIC_API_URL=https://TU-BACKEND.onrender.com
APPLE_WALLET_ENABLED=true
APPLE_PASS_TYPE_IDENTIFIER=pass.com.orbiticastudio.loyalty
APPLE_TEAM_IDENTIFIER=TU_TEAM_ID
APPLE_PASS_P12_BASE64=BASE64_DEL_P12
APPLE_PASS_P12_PASSWORD=CONTRASENA_DEL_P12
APPLE_WWDR_CERT_BASE64=BASE64_DEL_WWDR_PEM
APPLE_WALLET_WEB_SERVICE_SECRET=SECRETO_ALEATORIO_DE_64_CARACTERES
```

`PUBLIC_API_URL` debe ser HTTPS en producción. `APPLE_WALLET_WEB_SERVICE_SECRET` se usa para derivar el token privado de actualización de cada pase. Nunca pongas estos valores en Vercel ni GitHub.

### 9. Cómo se actualiza un pase instalado
El `.pkpass` contiene `webServiceURL` y `authenticationToken`. Al instalarlo, Wallet registra el dispositivo y su push token con Orbítica. Cuando cambian los sellos, Orbítica envía un push silencioso por APNs; Wallet consulta qué pase cambió y descarga el `.pkpass` actualizado. El campo de sellos usa `changeMessage`, por lo que Wallet puede mostrar el cambio al usuario.

## Google Wallet

### 1. Crear Issuer Account
Abrí Google Pay & Wallet Console y completá el onboarding de Google Wallet API. Copiá el Issuer ID.

### 2. Google Cloud
Creá o elegí un proyecto en Google Cloud y habilitá Google Wallet API.

### 3. Service Account
Creá una service account y una llave JSON. En Google Pay & Wallet Console → Users, invitá el correo de esa service account con rol Developer.

### 4. Base64 del JSON
PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("google-wallet-service-account.json"))
```

### 5. Variables en Render

```text
GOOGLE_WALLET_ENABLED=true
GOOGLE_WALLET_ISSUER_ID=TU_ISSUER_ID
GOOGLE_WALLET_SERVICE_ACCOUNT_JSON_BASE64=BASE64_DEL_JSON
```

Nunca pongas la llave JSON en GitHub.

### 6. Demo Mode y publicación
Las cuentas nuevas de Google Wallet empiezan en Demo Mode. Probá primero con cuentas de prueba. Para emitir pases a cualquier usuario, completá el Business Profile, prepará una Passes Class y solicitá Publishing Access en Google Pay & Wallet Console.

### 7. Cómo se actualiza un pase instalado
Después de cada cambio de sellos/canje, Orbítica hace PATCH al Loyalty Object del cliente. Actualiza el saldo y el texto de progreso. Cuando corresponde intenta `NOTIFY_ON_UPDATE`; si Google limita la notificación, Orbítica reintenta sin notificación para que el saldo igual quede sincronizado.

## Prueba
Después de guardar las variables, redeployá Render y Vercel. Abrí una tarjeta del cliente:

`https://TU-DOMINIO/card/TOKEN`

Si Apple/Google están configurados, aparecerán los botones correspondientes.

## Seguridad
- PostgreSQL sigue siendo la fuente de verdad de los sellos.
- El NFC no contiene saldo ni credenciales.
- Los certificados y llaves permanecen exclusivamente en Render.
- El token de actualización Apple se deriva por pase y no expone el secreto principal.
- Fallos temporales de Apple/Google no bloquean la venta ni la acreditación del sello.
- Rotá las llaves si alguna se expone.
