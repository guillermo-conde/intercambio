# Intercambio Navideño 🎄

## Desplegar en Vercel
1. Sube esta carpeta a un repo de GitHub (o ejecuta `npx vercel` dentro de la carpeta).
2. En el proyecto de Vercel: **Storage → Create Database → Neon (Postgres)** y conéctala al proyecto.
   Esto crea automáticamente la variable `DATABASE_URL`.
3. En **Settings → Environment Variables** agrega `ADMIN_PASSWORD` con la contraseña que quieras.
4. Haz **Redeploy**.
5. Entra a `/admin`, inicia sesión y pulsa **Generar sorteo**. Comparte los códigos.

Los participantes están en `api/_lib.js` (constante `PARTICIPANTS`).
La tabla `draws` se crea sola la primera vez.

## Seguridad
- Cada resultado se guarda cifrado (AES-256-GCM) con una llave derivada (scrypt) del código del participante.
- Los códigos se guardan cifrados con la contraseña de admin, así el admin los puede ver sin ver los resultados.
- Si cambias `ADMIN_PASSWORD` después de sortear, vuelve a sortear para poder ver los códigos.
