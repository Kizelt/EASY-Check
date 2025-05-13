@echo off
echo Démarrage de EASY-Check avec journalisation des erreurs...
npx electron . > launch_log.txt 2>&1
if %ERRORLEVEL% NEQ 0 (
  echo Erreur de lancement. Consultez launch_log.txt pour plus de détails.
  pause
) else (
  echo Application lancée avec succès.
)
