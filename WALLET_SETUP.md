# Orbítica Loyalty — Apple Wallet + Google Wallet

La aplicación ya incluye botones y endpoints para agregar la tarjeta del cliente a Apple Wallet y Google Wallet. Las credenciales se guardan únicamente en Render.

## Apple Wallet

### 1. Requisitos
- Membresía activa de Apple Developer.
- Un Pass Type ID propio de Orbítica.
- Un certificado Pass Type ID y su llave privada.
- El certificado intermedio WWDR correspondiente.

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
APPLE_WALLET_ENABLED=true
APPLE_PASS_TYPE_IDENTIFIER=pass.com.orbiticastudio.loyalty
APPLE_TEAM_IDENTIFIER=TU_TEAM_ID
APPLE_PASS_P12_BASE64=BASE64_DEL_P12
APPLE_PASS_P12_PASSWORD=CONTRASENA_DEL_P12
APPLE_WWDR_CERT_BASE64=BASE64_DEL_WWDR_PEM
```

Nunca pongas estos valores en Vercel ni GitHub.

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

## Prueba
Después de guardar las variables, redeployá Render y Vercel. Abrí una tarjeta del cliente:

`https://TU-DOMINIO/card/TOKEN`

Si Apple/Google están configurados, aparecerán los botones correspondientes.

## Seguridad
- PostgreSQL sigue siendo la fuente de verdad de los sellos.
- El NFC no contiene saldo ni credenciales.
- Los certificados y llaves permanecen exclusivamente en Render.
- Rotá las llaves si alguna se expone.

## Actualizaciones automáticas
Esta primera integración genera el pase con el saldo actual al momento de agregarlo. La tarjeta web siempre muestra el saldo en tiempo real. La sincronización automática de un pase ya instalado requiere una segunda capa: Google Wallet REST updates y, para Apple, PassKit Web Service + registro de dispositivos/APNs. No habilites promesas de notificaciones automáticas hasta completar esa capa.
