@echo off
echo Creating backup of EASY-Check project...

set TIMESTAMP=%date:~-4,4%-%date:~-7,2%-%date:~0,2%_%time:~0,2%-%time:~3,2%-%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=EASY-Check_backup_%TIMESTAMP%.zip

echo Backup file will be: %BACKUP_FILE%

powershell -Command "& {Add-Type -A 'System.IO.Compression.FileSystem'; [IO.Compression.ZipFile]::CreateFromDirectory('D:\EASY-Check', 'D:\EASY-Check\backups\%BACKUP_FILE%', [IO.Compression.CompressionLevel]::Optimal, $false);}"

if %ERRORLEVEL% NEQ 0 (
  echo Error creating backup.
  echo Attempting alternative backup method...
  powershell -Command "Compress-Archive -Path 'D:\EASY-Check\*' -DestinationPath 'D:\EASY-Check\backups\%BACKUP_FILE%' -Force"
)

if exist "D:\EASY-Check\backups\%BACKUP_FILE%" (
  echo Backup successfully created at:
  echo D:\EASY-Check\backups\%BACKUP_FILE%
) else (
  echo Failed to create backup.
)

pause
