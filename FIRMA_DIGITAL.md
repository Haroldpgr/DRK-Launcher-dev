# Firma Digital para DRK Launcher

## 📋 Información General

El error de firma digital aparece porque Windows requiere que los ejecutables estén firmados digitalmente para garantizar la seguridad y autenticidad del software.

## ⚠️ Estado Actual

- **Estado**: Las actualizaciones NO están firmadas digitalmente
- **Configuración**: El sistema está configurado para IGNORAR errores de firma en desarrollo/testing
- **Ubicación del código**: `src/main/updaterService.ts` (líneas 20-30)

## 🔐 ¿Qué es la Firma Digital?

La firma digital es un certificado que:
- Verifica que el software proviene del desarrollador auténtico
- Garantiza que no ha sido modificado o alterado
- Elimina advertencias de seguridad en Windows
- Mejora la confianza del usuario

## 📍 Dónde Obtener un Certificado de Firma de Código

### Opción 1: Certificados Comerciales (Recomendado para Producción)

#### 1. **DigiCert** (Más Popular)
- **Sitio Web**: https://www.digicert.com/code-signing/
- **Precio**: Desde ~$200 USD/año
- **Ventajas**: Ampliamente reconocido, confianza alta
- **Proceso**: Validación de identidad requerida

#### 2. **Sectigo (anteriormente Comodo)**
- **Sitio Web**: https://sectigo.com/ssl-certificates-tls/code-signing
- **Precio**: Desde ~$200 USD/año
- **Ventajas**: Precio competitivo, buena reputación

#### 3. **GlobalSign**
- **Sitio Web**: https://www.globalsign.com/en/code-signing-certificate
- **Precio**: Desde ~$200 USD/año
- **Ventajas**: Empresa establecida, buen soporte

#### 4. **SSL.com**
- **Sitio Web**: https://www.ssl.com/certificates/code-signing/
- **Precio**: Desde ~$200 USD/año
- **Ventajas**: Precio competitivo

### Opción 2: Certificados de Windows Store (Gratis para Apps de Microsoft Store)

Si publicas en Microsoft Store:
- **Sitio Web**: https://partner.microsoft.com/
- **Precio**: Gratis (requiere cuenta de desarrollador)
- **Limitación**: Solo para apps publicadas en Microsoft Store

### Opción 3: Certificados de Prueba (Solo para Desarrollo)

Para desarrollo local puedes crear certificados de prueba:
- **Herramienta**: `makecert.exe` o `signtool.exe` (incluidos en Windows SDK)
- **Limitación**: Solo funcionan en tu máquina, no son válidos para distribución

## 🔧 Cómo Configurar la Firma Digital

### Paso 1: Obtener el Certificado

1. Compra un certificado de una autoridad certificadora (CA)
2. Completa el proceso de validación de identidad
3. Descarga el certificado (.pfx o .p12)

### Paso 2: Configurar en package.json

```json
{
  "build": {
    "win": {
      "sign": {
        "certificateFile": "path/to/certificate.pfx",
        "certificatePassword": "tu_contraseña",
        "signingHashAlgorithms": ["sha256"],
        "timestampServer": "http://timestamp.digicert.com"
      },
      "publisherName": "DRK Team"
    }
  }
}
```

### Paso 3: Configurar Variables de Entorno (Recomendado)

**NO** guardes la contraseña en el código. Usa variables de entorno:

```json
{
  "build": {
    "win": {
      "sign": {
        "certificateFile": "${env.CSC_LINK}",
        "certificatePassword": "${env.CSC_KEY_PASSWORD}"
      }
    }
  }
}
```

Luego configura las variables:
```bash
# Windows PowerShell
$env:CSC_LINK="path/to/certificate.pfx"
$env:CSC_KEY_PASSWORD="tu_contraseña"
```

## 📝 Notas Importantes

### Seguridad
- **NUNCA** subas el certificado (.pfx) al repositorio Git
- Usa variables de entorno para contraseñas
- Guarda el certificado en un lugar seguro
- Haz backup del certificado

### Costos
- Los certificados comerciales cuestan aproximadamente $200-400 USD/año
- Algunos proveedores ofrecen descuentos para múltiples años
- Los certificados EV (Extended Validation) son más caros pero ofrecen mejor confianza

### Proceso de Validación
- La mayoría de CAs requieren validación de identidad
- Puede tomar 1-3 días hábiles
- Requiere documentación oficial (pasaporte, identificación, etc.)

## 🚀 Alternativas para Desarrollo/Testing

### Opción Actual (Implementada)
- El sistema ignora errores de firma digital
- Funciona para desarrollo y testing
- **NO recomendado para producción pública**

### Opción Temporal
- Usar certificados de prueba (solo funcionan localmente)
- No requiere compra
- No es válido para distribución

## 📚 Recursos Adicionales

- **Documentación de electron-builder**: https://www.electron.build/code-signing
- **Documentación de Windows**: https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools
- **Guía de firma de código**: https://www.digicert.com/kb/code-signing/microsoft-authenticode.htm

## ⚙️ Configuración Actual en el Código

**Archivo**: `src/main/updaterService.ts`

```typescript
// Líneas 20-30
// IMPORTANTE: Deshabilitar verificación de firma digital para desarrollo/testing
if (process.platform === 'win32') {
  (autoUpdater as any).verifySignatureAndIntegrity = false;
  console.log('[Updater] Verificación de firma digital deshabilitada (modo desarrollo/testing)');
}
```

**Nota**: Esta configuración permite que las actualizaciones funcionen sin firma digital, pero debería deshabilitarse cuando se obtenga un certificado válido.

## ✅ Checklist para Implementar Firma Digital

- [ ] Investigar y seleccionar proveedor de certificado
- [ ] Completar proceso de validación de identidad
- [ ] Obtener certificado (.pfx)
- [ ] Configurar variables de entorno para credenciales
- [ ] Actualizar `package.json` con configuración de firma
- [ ] Probar firma en build local
- [ ] Remover código que ignora errores de firma
- [ ] Verificar que las actualizaciones funcionen con certificado
- [ ] Documentar proceso para el equipo

---

**Última actualización**: 2024-12-18
**Versión del launcher**: 0.1.12

