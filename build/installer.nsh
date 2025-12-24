; Archivo de configuración NSIS personalizado para DRK Launcher
; Este archivo se incluye después de las definiciones de electron-builder

!macro customInstall
  ; Crear acceso directo en el escritorio
  CreateShortCut "$DESKTOP\DRK Launcher.lnk" "$INSTDIR\DRK Launcher.exe" "" "$INSTDIR\DRK Launcher.exe" 0
  
  ; Crear carpeta en el menú Inicio
  CreateDirectory "$SMPROGRAMS\DRK"
  CreateShortCut "$SMPROGRAMS\DRK\DRK Launcher.lnk" "$INSTDIR\DRK Launcher.exe" "" "$INSTDIR\DRK Launcher.exe" 0
!macroend

!macro customUnInstall
  ; Eliminar accesos directos
  Delete "$DESKTOP\DRK Launcher.lnk"
  Delete "$SMPROGRAMS\DRK\DRK Launcher.lnk"
  RMDir "$SMPROGRAMS\DRK"
!macroend

; CRÍTICO: Asegurar que la aplicación se ejecute después de instalar
; Esto es esencial para que las actualizaciones funcionen correctamente
!macro customFinish
  ; Ejecutar la aplicación después de instalar
  ; Esto se ejecuta automáticamente cuando runAfterFinish=true en package.json
  ; pero lo hacemos explícito aquí para asegurar que funcione
  Exec "$INSTDIR\DRK Launcher.exe"
!macroend
