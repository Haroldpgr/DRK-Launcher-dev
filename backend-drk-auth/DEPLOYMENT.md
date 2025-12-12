# Guía de Despliegue - Servidor de Autenticación Drk Launcher

Esta guía explica cómo desplegar el servidor de autenticación de Drk Launcher en servicios gratuitos o de bajo costo.

## 🌐 Opciones de Alojamiento

### Opción 1: Render (Recomendado - Gratis)

**Ventajas:**
- Plan gratuito disponible
- Soporte para Node.js
- HTTPS automático
- Despliegue automático desde GitHub

**Pasos:**

1. **Crear cuenta en Render:**
   - Visita: https://render.com
   - Regístrate con GitHub

2. **Crear nuevo Web Service:**
   - Click en "New" → "Web Service"
   - Conecta tu repositorio de GitHub
   - Configuración:
     - **Name:** `drk-launcher-auth`
     - **Environment:** `Node`
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `npm start`
     - **Plan:** Free

3. **Variables de Entorno:**
   - En la configuración del servicio, agrega:
     ```
     NODE_ENV=production
     PORT=10000
     BASE_URL=https://api.drklauncher.com
     JWT_SECRET=tu_secret_key_super_segura_aqui
     ACCESS_TOKEN_EXPIRY=86400
     REFRESH_TOKEN_EXPIRY=604800
     ```

4. **Desplegar:**
   - Render desplegará automáticamente
   - Obtendrás una URL como: `https://drk-launcher-auth.onrender.com`

### Opción 2: Railway (Gratis con límites)

**Pasos:**

1. Visita: https://railway.app
2. Conecta con GitHub
3. Crea nuevo proyecto desde repositorio
4. Railway detectará automáticamente Node.js
5. Agrega variables de entorno en la configuración
6. Despliega

### Opción 3: Vercel (Gratis)

**Nota:** Vercel es principalmente para frontend, pero puede funcionar con funciones serverless.

**Pasos:**

1. Instala Vercel CLI: `npm i -g vercel`
2. En el directorio del proyecto: `vercel`
3. Sigue las instrucciones

### Opción 4: Heroku (Plan gratuito descontinuado, pero hay alternativas)

**Alternativa:** Fly.io (Gratis con límites)

1. Visita: https://fly.io
2. Instala Fly CLI
3. Ejecuta: `fly launch`
4. Sigue las instrucciones

## 🔗 Configuración de Dominio

### Opción 1: Cloudflare (Gratis - Recomendado)

**Pasos:**

1. **Crear cuenta en Cloudflare:**
   - Visita: https://cloudflare.com
   - Regístrate gratis

2. **Agregar dominio:**
   - Si tienes un dominio, agrégalo a Cloudflare
   - Si no, puedes usar un subdominio de Cloudflare Pages

3. **Configurar DNS:**
   - Crea un registro CNAME:
     - **Name:** `api` (o el subdominio que quieras)
     - **Target:** `tu-servicio.onrender.com` (o la URL de tu servicio)
     - **Proxy:** Activado (para protección DDoS)

4. **SSL/TLS:**
   - Cloudflare proporciona SSL automático
   - Configura: SSL/TLS → Full (strict)

### Opción 2: Dominio Gratuito

**Servicios de dominios gratuitos:**

1. **Freenom** (https://www.freenom.com)
   - Dominios .tk, .ml, .ga, .cf gratuitos
   - Configura DNS apuntando a tu servicio

2. **No-IP** (https://www.noip.com)
   - DNS dinámico gratuito
   - Útil si tu IP cambia

### Opción 3: Subdominio de Render/Railway

- Render y Railway proporcionan URLs personalizadas
- Puedes configurar un dominio personalizado en la configuración

## 📝 Configuración Final

### 1. Actualizar URL en el Backend

En `backend-drk-auth/.env`:
```env
BASE_URL=https://api.drklauncher.com
```

### 2. Actualizar URL en el Frontend

En el código del launcher, actualiza:
```typescript
const DRK_AUTH_BASE_URL = 'https://api.drklauncher.com/authserver';
```

### 3. Verificar Endpoints

Prueba los endpoints después del despliegue:
```bash
curl https://api.drklauncher.com/health
```

## 🔒 Seguridad

1. **JWT_SECRET:** Usa un secreto fuerte y único
2. **HTTPS:** Siempre usa HTTPS en producción
3. **Rate Limiting:** Considera agregar rate limiting (express-rate-limit)
4. **CORS:** Configura CORS correctamente para tu dominio
5. **Variables de Entorno:** Nunca commitees `.env` con secretos reales

## 📊 Monitoreo

Considera agregar:
- **Uptime Monitoring:** UptimeRobot (gratis)
- **Logs:** Los servicios de hosting suelen proporcionar logs
- **Alertas:** Configura alertas para caídas del servicio

## 🆘 Troubleshooting

### El servidor no inicia
- Verifica que el puerto esté configurado correctamente
- Revisa los logs del servicio de hosting

### Error de CORS
- Verifica la configuración de CORS en `src/index.ts`
- Asegúrate de que el dominio del frontend esté permitido

### Tokens no funcionan
- Verifica que `JWT_SECRET` sea el mismo en todos los entornos
- Revisa la expiración de tokens

## 📚 Recursos Adicionales

- [Documentación de Render](https://render.com/docs)
- [Documentación de Railway](https://docs.railway.app)
- [Documentación de Cloudflare](https://developers.cloudflare.com)

