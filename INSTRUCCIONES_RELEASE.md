# 🚀 Instrucciones para Publicar la Actualización v0.1.1

## ✅ Pasos Completados

1. ✅ Versión actualizada a `0.1.1` en `package.json`
2. ✅ `CHANGELOG.md` actualizado con los cambios
3. ✅ Build completado exitosamente
4. ✅ Instalador creado: `release\DRK-Launcher-0.1.1-Setup.exe`

## 📤 Publicar en GitHub

### Paso 1: Ir a GitHub Releases

1. Ve a: https://github.com/Haroldpgr/DRK-Launcher-dev/releases
2. Haz clic en **"Draft a new release"** o **"Create a new release"**

### Paso 2: Configurar el Release

**Tag version:** `v0.1.1`

**Release title:** `v0.1.1 - Sistema de Temas Mejorado`

**Description (copia esto):**

```markdown
## 🎉 Nueva Versión 0.1.1

### ✨ Nuevas Características
- Sistema de temas completo con soporte para tema claro, oscuro y OLED
- Selector de color de énfasis mejorado con vista previa en tiempo real
- Componente ToggleSwitch reutilizable que respeta los temas
- Sección de Información del Launcher en Settings

### 🔧 Mejoras
- Sistema de temas completamente rediseñado - ahora cambia todos los colores de la aplicación
- Tema claro: fondo completamente blanco con texto oscuro
- Color de énfasis funciona correctamente en todos los temas
- Todas las secciones de Settings (Apariencia, Comportamiento, Privacidad) usan variables CSS
- Mejor integración visual entre componentes

### 🗑️ Eliminado
- Sección de Java en Settings (ya no es necesaria)

### 🐛 Correcciones
- Corregido problema donde algunos elementos no cambiaban de color con los temas
- Mejorado el sistema de variables CSS para mayor consistencia
```

### Paso 3: Subir el Instalador

1. En la sección **"Attach binaries"**, haz clic en **"select them from your computer"**
2. Navega a: `C:\Users\harol\OneDrive\Documentos\Plan_Nuevo\release\`
3. Selecciona: `DRK-Launcher-0.1.1-Setup.exe`
4. También puedes arrastrar el archivo directamente

### Paso 4: Publicar

1. Marca **"Set as the latest release"** (si está disponible)
2. Haz clic en **"Publish release"**

## 🧪 Probar la Actualización

### Opción 1: Instalar la versión anterior primero

1. Si tienes la versión `0.1.0` instalada, ábrela
2. Espera 3 segundos (el sistema verifica actualizaciones automáticamente)
3. Deberías ver el modal de actualización con los cambios

### Opción 2: Simular versión anterior

1. Abre el launcher actual
2. En la consola del desarrollador (F12), ejecuta:
   ```javascript
   localStorage.setItem('launcher_version', '0.1.0');
   ```
3. Reinicia el launcher
4. Debería detectar la actualización

## 📋 Notas Importantes

- El sistema de actualizaciones verifica cada 4 horas automáticamente
- También verifica al iniciar el launcher (después de 3 segundos)
- El modal mostrará los cambios en un carrusel
- Los usuarios pueden elegir "Actualizar ahora" o "Más tarde"

## ✅ Verificación

Después de publicar, verifica que:

1. ✅ El release está publicado en GitHub
2. ✅ El archivo `.exe` está adjunto
3. ✅ Las release notes están completas
4. ✅ El tag `v0.1.1` está creado

¡Listo! Los usuarios recibirán la actualización automáticamente. 🎉

