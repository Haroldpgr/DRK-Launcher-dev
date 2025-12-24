# 📝 Cómo Actualizar la Versión del Launcher

## 📍 Dónde está la Versión

La versión se encuentra en **`package.json`** en la línea 3:

```json
{
  "name": "drk-launcher",
  "version": "0.1.0",  ← AQUÍ está la versión
  ...
}
```

## 🔄 Cómo Actualizar la Versión

### Opción 1: Automático (Recomendado) ✅

Usa el comando `npm version` que actualiza automáticamente:

```bash
# Versión PATCH (0.1.0 → 0.1.1) - Correcciones menores
npm version patch

# Versión MINOR (0.1.0 → 0.2.0) - Nuevas características
npm version minor

# Versión MAJOR (0.1.0 → 2.0.0) - Cambios grandes
npm version major
```

**Este comando:**
- ✅ Actualiza `package.json` automáticamente
- ✅ Crea un commit de git (si tienes git)
- ✅ Crea un tag de git con la versión

### Opción 2: Manual

Edita directamente `package.json`:

```json
{
  "version": "0.1.1"  ← Cambia esto manualmente
}
```

## 🚀 Flujo Completo de Actualización

### Paso 1: Actualizar Versión
```bash
npm version patch  # 0.1.0 → 0.1.1
```

### Paso 2: Publicar
```bash
npm run dist
```

Esto:
1. Compila el código
2. Crea el instalador `.exe`
3. Crea un release en GitHub con la nueva versión

### Paso 3: Agregar Release Notes
1. Ve a: https://github.com/Haroldpgr/DRK-Launcher-dev/releases
2. Edita el release más reciente
3. Agrega las notas de cambios
4. Guarda

## 📊 Sistema de Versiones (Semantic Versioning)

Formato: `MAJOR.MINOR.PATCH`

- **PATCH** (0.1.0 → 0.1.1): Correcciones de errores
- **MINOR** (0.1.0 → 0.2.0): Nuevas características (compatibles)
- **MAJOR** (0.1.0 → 2.0.0): Cambios grandes (pueden romper compatibilidad)

### Ejemplos:

```bash
# Corrección de bug
npm version patch  # 0.1.0 → 0.1.1

# Nueva característica
npm version minor  # 0.1.1 → 0.2.0

# Cambio importante
npm version major  # 0.2.0 → 1.0.0
```

## 🔍 Dónde se Muestra la Versión

La versión se muestra automáticamente en:

1. **Configuración → Información**: Muestra la versión actual
2. **Modal de Actualizaciones**: Compara con la versión en GitHub
3. **Instalador**: El nombre del `.exe` incluye la versión

## ⚠️ Importante

- **Siempre incrementa la versión** antes de publicar
- **La versión debe ser mayor** que la anterior para que se detecte como actualización
- **No uses la misma versión** dos veces

## 📝 Ejemplo Práctico

```bash
# 1. Haces cambios en el código
# 2. Actualizas versión
npm version patch

# 3. Publicas
npm run dist

# 4. Agregas Release Notes en GitHub
# 5. ¡Listo! Los usuarios recibirán la actualización
```

