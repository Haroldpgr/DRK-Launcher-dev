# 🚀 Guía Rápida: Sistema de Actualizaciones (100% GRATIS)

## ✅ ¿Es Gratis GitHub Releases?

**¡SÍ! GitHub Releases es 100% GRATIS** para siempre. Incluye:
- ✅ Repositorios públicos ilimitados
- ✅ Releases ilimitados
- ✅ Descargas ilimitadas
- ✅ Sin límites de ancho de banda
- ✅ CDN global (descargas rápidas en todo el mundo)

## 📋 Pasos Rápidos para Configurar

### 1. Crear Repositorio en GitHub (2 minutos)

1. Ve a https://github.com/new
2. Crea un repositorio llamado `drk-launcher`
3. Puede ser público o privado (ambos son gratis)

### 2. Actualizar package.json ✅ (YA ESTÁ CONFIGURADO)

Tu `package.json` ya está configurado con:
```json
"publish": [
  {
    "provider": "github",
    "owner": "Haroldpgr",
    "repo": "DRK-Launcher-dev"
  }
]
```

**¡Perfecto! Ya está listo.** Solo necesitas el token ahora.

### 3. Configurar Token (Solo para Publicar) ✅

**Solo necesitas esto para PUBLICAR actualizaciones, NO para recibirlas.**

Veo que ya estás en la página de crear token. Sigue estos pasos:

1. **Nota**: Escribe "DRK Launcher Updates" (o cualquier nombre que prefieras)
2. **Vencimiento**: Selecciona el tiempo que prefieras (30 días, 60 días, 90 días, o sin expiración)
3. **Seleccionar ámbitos**: 
   - ✅ **Marca la casilla `repositorio`** (repository) - Esto es lo que necesitas
   - ❌ No necesitas marcar los otros scopes
4. Click en **"Generar token"** (abajo de la página)
5. **⚠️ IMPORTANTE: Copia el token inmediatamente** - Solo se muestra una vez y no podrás verlo de nuevo

**Windows (PowerShell):**
```powershell
$env:GH_TOKEN="ghp_tu_token_aqui"
```

**Linux/Mac:**
```bash
export GH_TOKEN=ghp_tu_token_aqui
```

### 4. Publicar Primera Versión

```bash
# 1. Actualizar versión
npm version patch  # 0.1.0 -> 0.1.1

# 2. Construir y publicar
npm run dist

# ¡Listo! Se creará automáticamente un release en GitHub
```

## 🎯 ¿Qué Pasa Después?

1. **Tú publicas** una nueva versión con `npm run dist`
2. **GitHub crea** automáticamente un release
3. **Los usuarios** reciben notificación automática
4. **Se descarga** la actualización automáticamente
5. **Se instala** al reiniciar el launcher

## 💡 Preguntas Frecuentes

### ¿Los usuarios necesitan cuenta de GitHub?
**NO.** Solo necesitan tener el launcher instalado. Las actualizaciones son automáticas.

### ¿Cuánto cuesta?
**$0.00** - Completamente gratis para siempre.

### ¿Hay límites?
**NO.** Puedes publicar tantas actualizaciones como quieras.

### ¿Funciona con repositorio privado?
**SÍ.** Pero los usuarios necesitarán acceso al repositorio (puedes darles acceso de solo lectura).

### ¿Puedo usar otro servicio?
**SÍ.** Puedes usar:
- Servidor propio
- Netlify (gratis)
- Vercel (gratis)
- Cualquier hosting estático

## 🔒 Seguridad

- El token solo se usa para PUBLICAR, no para recibir actualizaciones
- Los usuarios NO necesitan tokens
- GitHub es seguro y confiable
- Puedes revocar el token en cualquier momento

## 📞 Soporte

Si tienes problemas:
1. Verifica que el token tenga permisos `repo`
2. Verifica que el repositorio exista
3. Verifica que la versión en `package.json` sea mayor que la anterior
4. Revisa los logs en la consola del launcher

