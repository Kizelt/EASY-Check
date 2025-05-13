@echo off
echo.
echo ========================================================
echo    EASY-Check - Options de sauvegarde
echo ========================================================
echo.
echo  1. Sauvegarde avec Git via WSL (recommandé)
echo  2. Sauvegarde en archive ZIP
echo.
set /p choice="Choisissez une option (1 ou 2): "

if "%choice%"=="1" (
  call git_save.bat
) else if "%choice%"=="2" (
  call create_backup.bat
) else (
  echo Option non reconnue.
  pause
  exit /b
)
