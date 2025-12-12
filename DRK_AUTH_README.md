# Sistema de Autenticación Drk Launcher

Sistema completo de autenticación para Drk Launcher, implementando el protocolo Yggdrasil (Mojang Legacy Auth).

## 📁 Estructura del Proyecto

```
.
├── src/
│   ├── web/                   # Servidor backend (Node.js/Express)
│   │   ├── src/
│   │   │   ├── index.ts      # Servidor principal
│   │   │   ├── routes/       # Rutas de API
│   │   │   ├── database/     # Almacenamiento (memoria/DB)
│   │   │   ├── utils/        # Utilidades
│   │   │   └── types/        # Tipos TypeScript
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── main/
│   │   ├── drkAuthClient.ts  # Cliente de autenticación
│   │   └── main.ts           # IPC handlers
│   │
│   └── renderer/
│       ├── services/
│       │   └── drkAuthService.ts  # Servicio de autenticación
│       └── components/
│           └── DrkLoginScreen.tsx  # Componente de login
```

## 🚀 Inicio Rápido

### Backend

1. **Instalar dependencias:**
```bash
cd src/web
npm install
```

2. **Configurar variables de entorno:**
```bash
# Crear archivo .env en src/web/
# Ver README_INSTALL.md para el contenido
```

3. **Compilar y ejecutar:**
```bash
npm run build
npm start
```

Para desarrollo:
```bash
npm run dev
```

### Frontend

El frontend ya está integrado en el launcher. El componente `DrkLoginScreen` está listo para usar.

## 🔐 Usuario de Prueba

El backend incluye un usuario de prueba:

- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Profile:** `AdminPlayer`

## 📡 Endpoints del Backend

### Autenticación

- `POST /authserver/authenticate` - Autenticar usuario
- `POST /authserver/refresh` - Refrescar token
- `POST /authserver/validate` - Validar token

### Sesiones

- `GET /sessionserver/session/minecraft/profile/<UUID>` - Obtener perfil con texturas

## 🎨 Uso del Frontend

### Componente LoginScreen

```tsx
import DrkLoginScreen from './components/DrkLoginScreen';

<DrkLoginScreen
  onLoginSuccess={(username) => {
    console.log('Usuario autenticado:', username);
  }}
  onClose={() => {
    // Cerrar modal
  }}
/>
```

### Servicio de Autenticación

```tsx
import { drkAuthService } from './services/drkAuthService';

// Autenticar
const result = await drkAuthService.authenticate('usuario', 'contraseña');

// Refrescar tokens
const refreshResult = await drkAuthService.refresh(accessToken, clientToken);

// Validar token
const validateResult = await drkAuthService.validate(accessToken);
```

## ⚙️ Configuración

### URL del Servidor

**Backend (`src/web/.env`):**
```env
BASE_URL=https://api.drklauncher.com
PORT=3000
```

**Frontend (`src/main/main.ts`):**
```typescript
const DRK_AUTH_BASE_URL = process.env.DRK_AUTH_BASE_URL || 'https://api.drklauncher.com/authserver';
```

## 🌐 Despliegue

Ver `src/web/DEPLOYMENT.md` para instrucciones detalladas de despliegue en servicios gratuitos (Render, Railway, etc.).

## 📝 Notas

- El backend usa almacenamiento en memoria para desarrollo
- Para producción, migrar a una base de datos real (PostgreSQL, MongoDB)
- Las contraseñas se hashean con bcrypt
- Los tokens expiran según configuración en `.env`

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Tokens seguros generados aleatoriamente
- ✅ Validación de sesiones
- ✅ CORS configurado
- ✅ Manejo de errores robusto

## 📚 Documentación Adicional

- [README del Backend](./src/web/README.md)
- [Guía de Despliegue](./src/web/DEPLOYMENT.md)
- [Instrucciones de Instalación](./src/web/README_INSTALL.md)

