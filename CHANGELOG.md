# 📋 Registro de Cambios - DRK Launcher

Todas las mejoras, nuevas características y correcciones de errores se documentan aquí.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [0.1.4] - 2025-01-18

### 🔧 Mejoras
- Sistema de actualizaciones mejorado con validación de tamaño real de archivos
- Actualizaciones diferenciales (delta) habilitadas - descarga solo los cambios cuando está disponible
- Validación automática para evitar descargas duplicadas (no ocupa espacio innecesario)
- Mejor detección de conexión a internet con verificación periódica
- Mejor manejo de estado cuando la actualización está descargada

### 🐛 Correcciones
- Corregido bug donde el botón "Actualizar" requería dos clics para iniciar la descarga
- Corregido bug donde mostraba "sin conexión" cuando la actualización estaba descargada
- Corregido bug donde el botón "Más tarde" no funcionaba correctamente
- Mejorada la validación del tamaño real de los archivos de actualización
- Corregido problema donde no se mostraba correctamente el estado "descargada"

---

## [0.1.5] - 2025-01-18

### 🎨 Mejoras Visuales
- Logo mejorado en la barra lateral - ahora siempre se muestra correctamente
- Mejor manejo de fallback del logo con diseño estilizado
- Logo con mejor contraste y visibilidad

### 🔧 Mejoras
- Mejorado el sistema de carga de imágenes del logo
- Fallback visual mejorado si el logo no se carga

---

## [Sin Publicar]

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

---

## [0.1.1] - 2025-01-18

### ✨ Nuevas Características
- Sistema de actualizaciones automáticas con modal interactivo
- Carrusel de cambios en el modal de actualizaciones
- Validación de archivos durante la actualización
- Instalación automática programada
- Sistema de feedback integrado
- Encriptación de tokens de GitHub

### 🔧 Mejoras
- Interfaz de actualizaciones más moderna y visual
- Mejor manejo de errores en actualizaciones
- Soporte para actualizaciones sin conexión
- Optimización de compilación de Tailwind CSS
- Mejora en el formato de mensajes de feedback

### 🐛 Correcciones
- Prevención de duplicados en actualizaciones
- Validación mejorada de archivos descargados

---

## [0.1.0] - 2025-01-17

### ✨ Nuevas Características
- Sistema de feedback integrado
- Modal de actualizaciones automáticas
- Encriptación de tokens de GitHub

### 🔧 Mejoras
- Optimización de compilación de Tailwind CSS
- Mejora en el formato de mensajes de feedback

---

## Cómo Usar Este Archivo

### Para Agregar Cambios en una Nueva Versión:

1. **Copia la sección "[Sin Publicar]"** y renómbrala con la nueva versión:
   ```markdown
   ## [0.1.1] - 2025-01-18
   ```

2. **Agrega tus cambios** usando estas categorías:
   - `### ✨ Nuevas Características` - Funciones nuevas
   - `### 🔧 Mejoras` - Mejoras a funciones existentes
   - `### 🐛 Correcciones` - Corrección de errores
   - `### 🗑️ Eliminado` - Funciones eliminadas
   - `### 🔒 Seguridad` - Mejoras de seguridad

3. **Ejemplo:**
   ```markdown
   ## [0.1.1] - 2025-01-18

   ### ✨ Nuevas Características
   - Agregado soporte para modpacks de CurseForge
   - Nueva interfaz de selección de mods

   ### 🔧 Mejoras
   - Mejorado el rendimiento al cargar instancias
   - Optimizado el uso de memoria

   ### 🐛 Correcciones
   - Corregido error al importar modpacks grandes
   - Solucionado problema de cierre inesperado
   ```

4. **Al publicar en GitHub**, copia el contenido de la versión a las "Release Notes" del release.

### Formato para GitHub Releases:

Cuando crees un release en GitHub, usa este formato:

```markdown
## 🎉 Nueva Versión 0.1.1

### ✨ Nuevas Características
- Agregado soporte para modpacks de CurseForge
- Nueva interfaz de selección de mods

### 🔧 Mejoras
- Mejorado el rendimiento al cargar instancias
- Optimizado el uso de memoria

### 🐛 Correcciones
- Corregido error al importar modpacks grandes
- Solucionado problema de cierre inesperado
```

**Nota:** El carrusel del modal de actualizaciones mostrará cada elemento de la lista como una diapositiva separada.

