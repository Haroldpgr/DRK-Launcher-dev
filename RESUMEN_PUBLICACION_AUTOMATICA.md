# 🚀 Resumen: Publicación Automática

## ✅ Configuración Completa

Todo está listo para publicar actualizaciones automáticamente. Solo necesitas ejecutar:

```bash
npm run release
```

## 📋 Comandos Disponibles

### Opción 1: Todo Automático (Recomendado) ⭐

```bash
# Versión PATCH (0.1.0 → 0.1.1)
npm run release

# Versión MINOR (0.1.0 → 0.2.0)
npm run release:minor

# Versión MAJOR (0.1.0 → 2.0.0)
npm run release:major
```

**Este comando hace:**
1. ✅ Actualiza `package.json` (versión)
2. ✅ Compila el código
3. ✅ Crea el instalador
4. ✅ Publica en GitHub Releases
5. ✅ Adjunta el instalador
6. ✅ Los usuarios reciben la actualización automáticamente

### Opción 2: Pasos Separados

```bash
# 1. Actualizar versión manualmente
npm version patch  # o minor/major

# 2. Publicar
npm run dist:publish
```

## 🔑 Configurar Token (Solo Primera Vez)

**PowerShell:**
```powershell
$env:GH_TOKEN="ghp_tu_token_de_github"
```

**O usar el token encriptado:**
El script intentará desencriptar automáticamente el token de `.github/token.encrypted` si existe.

## 📝 Actualizar CHANGELOG

Antes de publicar, actualiza `CHANGELOG.md`:

```markdown
## [0.1.2] - 2025-01-18

### ✨ Nuevas Características
- Nueva funcionalidad X

### 🔧 Mejoras
- Mejora Y
```

El script leerá automáticamente esta sección como release notes.

## 🎯 Flujo Completo

```bash
# 1. Editar CHANGELOG.md (opcional, pero recomendado)
# 2. Publicar
npm run release

# ¡Listo! Los usuarios recibirán la actualización automáticamente
```

## ✅ Verificación

Después de ejecutar `npm run release`:

1. ✅ Release publicado en GitHub
2. ✅ Instalador adjunto
3. ✅ Tag creado (v0.1.1)
4. ✅ Los usuarios con versión anterior recibirán la actualización automáticamente

## 🎉 ¡Todo Automático!

Con esta configuración, cada vez que ejecutes `npm run release`, todo se publicará automáticamente y los usuarios recibirán la actualización en su launcher instalado. 🚀

