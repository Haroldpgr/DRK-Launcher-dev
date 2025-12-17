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
