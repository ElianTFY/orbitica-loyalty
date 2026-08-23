# Publicar Orbítica Loyalty v1.1 — GitHub + Render + Vercel

## 1. Preparar el repositorio

1. Descomprimí el ZIP.
2. Creá un repositorio **privado** en GitHub llamado, por ejemplo, `orbitica-loyalty`.
3. Subí el contenido de esta carpeta a la raíz del repositorio.
4. Confirmá que GitHub NO muestre archivos `.env`, llaves `.pem`, `.key` o credenciales.
5. Activá 2FA en GitHub.

No agregues secretos como GitHub repository variables salvo que un workflow realmente los necesite. Esta versión no los necesita para CI.

## 2. Crear `BFF_SHARED_SECRET`

En Windows/PowerShell podés ejecutar:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Guardá el valor temporalmente en un gestor de contraseñas. Se colocará **idéntico** en Render y Vercel. No se sube a GitHub.

## 3. Desplegar API + PostgreSQL en Render

1. Entrá a Render.
2. Elegí **New → Blueprint**.
3. Conectá el repositorio privado de GitHub.
4. Render leerá `render.yaml` y propondrá:
   - `orbitica-loyalty-api`
   - `orbitica-loyalty-db`
5. Cuando solicite variables `sync: false`, completá:
   - `BFF_SHARED_SECRET`: el secreto generado en el paso 2.
   - `PUBLIC_WEB_URL`: inicialmente podés usar `https://placeholder.invalid`.
   - `BOOTSTRAP_SUPERADMIN_EMAIL`: tu correo de administración.
   - `BOOTSTRAP_SUPERADMIN_PASSWORD`: contraseña fuerte, única, mínimo 12 caracteres, mayúscula, minúscula, número y símbolo.
   - `DEMO_OWNER_EMAIL`: correo del dueño/demo de Barbería Porras.
   - `DEMO_OWNER_PASSWORD`: otra contraseña fuerte y única.
6. `JWT_SECRET` lo genera Render automáticamente y no debe copiarse al frontend.
7. Aplicá el Blueprint.
8. Esperá a que PostgreSQL y API queden verdes.
9. Copiá la URL de la API, por ejemplo:

```text
https://orbitica-loyalty-api.onrender.com
```

10. Probá `/health`. En producción `/docs` debe responder 404: es intencional.

## 4. Desplegar frontend/BFF en Vercel

1. Entrá a Vercel → **Add New → Project**.
2. Importá el mismo repositorio.
3. En **Root Directory**, seleccioná `frontend`.
4. Agregá variables de entorno de Production:

```text
BACKEND_URL=https://TU-API.onrender.com
BFF_SHARED_SECRET=EL_MISMO_SECRETO_DEL_PASO_2
```

5. Verificá que **ninguna** variable se llame `NEXT_PUBLIC_BFF_SHARED_SECRET`.
6. Deploy.
7. Copiá la URL final, por ejemplo:

```text
https://orbitica-loyalty.vercel.app
```

## 5. Terminar la conexión

1. Volvé a Render → API → Environment.
2. Cambiá `PUBLIC_WEB_URL` por la URL exacta de Vercel:

```text
https://orbitica-loyalty.vercel.app
```

3. Guardá y redeployá la API.
4. Abrí:

```text
https://orbitica-loyalty.vercel.app/login
```

5. Iniciá sesión con la cuenta demo/dueño.
6. Probá:
   - crear cliente;
   - agregar sello;
   - canjear premio;
   - crear/desactivar empleado;
   - cambiar contraseña;
   - cerrar sesión e iniciar de nuevo.
7. Probá la página pública:

```text
https://orbitica-loyalty.vercel.app/join/porras
```

8. Registrá un cliente de prueba, abrí su tarjeta, agregale un sello desde el panel y comprobá que se actualice.
9. Intentá registrarte otra vez con el mismo teléfono: **no debe entregar el token existente**.

## 6. GitHub Security

En el repositorio:

- Settings → General → Repository visibility: **Private**.
- Settings → Security → activá Dependabot alerts si tu plan lo permite.
- Revisá la pestaña Actions: `Security and tests` debe terminar en verde.
- No merges cambios si tests/build/auditoría fallan sin entender la causa.

## 7. Dominio propio

Cuando la prueba funcione, conectá un subdominio en Vercel, por ejemplo:

```text
loyalty.orbiticastudio.com
```

Luego actualizá `PUBLIC_WEB_URL` en Render al dominio definitivo y redeployá. El QR/NFC debe utilizar la URL definitiva del frontend, no la URL de Render.

## 8. NFC

Para Barbería Porras, una vez definido el dominio final, programá el NTAG213 con:

```text
https://TU-DOMINIO/join/porras
```

El QR del dashboard usa la misma ruta. Los puntos/sellos permanecen en PostgreSQL; nunca se guardan en el chip NFC.

## 9. Antes de clientes reales

- Probá en iPhone + Android.
- Probá Safari + Chrome.
- Probá dueño + empleado.
- Confirmá backups de PostgreSQL.
- Confirmá 2FA en GitHub/Vercel/Render.
- Guardá las credenciales en un gestor de contraseñas.
- No compartas la cuenta superadmin con empleados.
