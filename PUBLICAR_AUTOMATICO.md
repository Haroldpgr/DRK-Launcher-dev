# 🚀 Publicación Automática en GitHub Releases

## ✅ Configuración Completa

Ahora puedes publicar actualizaciones automáticamente con un solo comando.

## 📋 Flujo Automático

### Opción 1: Todo en un Comando (Recomendado) ⭐

```bash
# Para versión PATCH (0.1.0 → 0.1.1)
npm run release

# Para versión MINOR (0.1.0 → 0.2.0)
npm run release:minor

# Para versión MAJOR (0.1.0 → 2.0.0)
npm run release:major
```

**Este comando hace automáticamente:**
1. ✅ Actualiza la versión en `package.json`
2. ✅ Compila el código
3. ✅ Crea el instalador
4. ✅ Publica en GitHub Releases
5. ✅ Adjunta el instalador al release
6. ✅ Usa el CHANGELOG.md como release notes

### Opción 2: Pasos Separados

```bash
# 1. Actualizar versión
npm version patch  # o minor/major

# 2. Publicar automáticamente
npm run dist:publish
```

## 🔑 Configurar Token de GitHub

Para que la publicación automática funcione, necesitas configurar el token de GitHub:

### Opción 1: Variable de Entorno (Recomendado)

**PowerShell:**
```powershell
$env:GH_TOKEN="tu_token_de_github_aqui"
```

**CMD:**
```cmd
set GH_TOKEN=tu_token_de_github_aqui
```

**Permanente (PowerShell):**
```powershell
[System.Environment]::SetEnvironmentVariable('GH_TOKEN', 'tu_token_de_github_aqui', 'User')
```

### Opción 2: Token Encriptado

Si ya tienes el token encriptado en `.github/token.encrypted`, el script intentará desencriptarlo automáticamente.

## 📝 Release Notes Automáticas

El script lee automáticamente el `CHANGELOG.md` y usa la sección de la versión actual como release notes.

**Formato esperado en CHANGELOG.md:**
```markdown
## [0.1.1] - 2025-01-18

### ✨ Nuevas Características
- Sistema de temas completo

### 🔧 Mejoras
- Mejorado el sistema de temas
```

Si no encuentra la versión específica, usará la sección "[Sin Publicar]".

## 🎯 Ejemplo Completo

```bash
# 1. Actualizar CHANGELOG.md con los cambios
# (Edita manualmente la sección [Sin Publicar])

# 2. Publicar (todo automático)
npm run release

# ¡Listo! El release está publicado y los usuarios recibirán la actualización
```

## ✅ Verificación

Después de ejecutar `npm run release`, verifica:

1. ✅ Release publicado en: https://github.com/Haroldpgr/DRK-Launcher-dev/releases
2. ✅ Instalador adjunto al release
3. ✅ Release notes completas
4. ✅ Tag creado (v0.1.1)

## 🔍 Probar la Actualización

1. **Instala la versión anterior** (si no la tienes)
2. **Abre el launcher**
3. **Espera 3-5 segundos** (verificación automática)
4. **Deberías ver el modal de actualización** 🎉

## 🐛 Solución de Problemas

### Error: "No se encontró el token de GitHub"

**Solución:**
```powershell
# Configurar token
$env:GH_TOKEN="ghp_tu_token_aqui"

# Luego ejecutar
npm run release
```

### Error: "Git working directory not clean"

**Solución:**
```bash
# Hacer commit de los cambios primero
git add .
git commit -m "Preparar release v0.1.1"

# O usar --no-git-tag-version
npm version patch --no-git-tag-version
npm run dist:publish
```

### Error al publicar en GitHub

**Verifica:**
- ✅ Token tiene permisos de `repo` en GitHub
- ✅ Token no ha expirado
- ✅ Repositorio existe y tienes acceso
- ✅ No hay un release con la misma versión

## 📋 Checklist Antes de Publicar

- [ ] Actualizado `CHANGELOG.md` con los cambios
- [ ] Token de GitHub configurado (`GH_TOKEN` o `GITHUB_TOKEN`)
- [ ] Cambios probados localmente
- [ ] Versión correcta en `package.json`

## 🎉 ¡Listo!

Con esta configuración, cada vez que ejecutes `npm run release`, todo se publicará automáticamente y los usuarios recibirán la actualización. 🚀

