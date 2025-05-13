@echo off
echo Sauvegarde du projet EASY-Check avec Git via WSL...

REM Chemin du projet dans WSL (ajustez le chemin si nécessaire)
set WSL_PATH=/mnt/d/EASY-Check

REM Commandes Git à exécuter
echo Initialisation du dépôt Git et commit des changements...

REM Exécuter les commandes Git dans WSL
wsl bash -c "cd %WSL_PATH% && if [ ! -d .git ]; then git init; fi && git add . && git commit -m 'Integration des MCP Claude Desktop' && echo 'Commit effectué avec succès!'"

echo.
echo Pour pousser ces changements vers GitHub, vous pouvez exécuter ces commandes dans un terminal WSL :
echo cd %WSL_PATH%
echo git remote add origin https://github.com/votre-username/EASY-Check.git
echo git push -u origin main

pause
