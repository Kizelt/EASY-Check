@echo off
echo ===== Script de dépannage EASY-Check =====
echo.

echo 1. Vérification et réparation des modules Node...
cd /d D:\EASY-Check
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de l'installation des modules. Code: %ERRORLEVEL%
    goto end
) else (
    echo Modules installés avec succès.
)
echo.

echo 2. Vérification de l'installation d'Electron...
call npx electron --version
if %ERRORLEVEL% NEQ 0 (
    echo Electron n'est pas installé correctement. Tentative de réinstallation...
    call npm uninstall electron
    call npm install electron --save
    if %ERRORLEVEL% NEQ 0 (
        echo Échec de la réinstallation d'Electron. Code: %ERRORLEVEL%
        goto end
    ) else (
        echo Electron réinstallé avec succès.
    )
) else (
    echo Electron est correctement installé.
)
echo.

echo 3. Vérification des fichiers principaux...
if not exist index.js (
    echo ERREUR: Le fichier index.js est manquant!
    goto end
)
if not exist src\index.html (
    echo ERREUR: Le fichier src\index.html est manquant!
    goto end
)
if not exist src\renderer.js (
    echo ERREUR: Le fichier src\renderer.js est manquant!
    goto end
)
echo Tous les fichiers principaux sont présents.
echo.

echo 4. Tentative de lancement...
call npx electron . > launch_log.txt 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Échec du lancement. Consultez le fichier launch_log.txt pour les détails.
    type launch_log.txt
) else (
    echo Application lancée avec succès.
)

:end
echo.
echo ===== Fin du dépannage =====
pause
