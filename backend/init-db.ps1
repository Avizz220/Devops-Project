<#
PowerShell helper to run the manual SQL file using the local mysql client.
It will prompt you for the MySQL root password interactively (secure).
Usage:
  .\init-db.ps1            # uses root user and bundled SQL file
  .\init-db.ps1 -RootUser admin

Prerequisites: mysql client must be in PATH (mysql.exe). If not, provide full path to mysql in -MysqlClientPath.
#>

param(
    [string]$RootUser = "root",
    [string]$SqlFile = "$PSScriptRoot\create_users_manual.sql",
    [string]$MysqlClientPath = "mysql"
)

if (-not (Test-Path $SqlFile)) {
    Write-Host "SQL file not found at $SqlFile"
    exit 1
}

Write-Host "About to run the SQL file to create database and user: $SqlFile"
Write-Host "You will be prompted for the MySQL password for user '$RootUser'."

# Build command which prompts for password interactively
$cmd = "$MysqlClientPath -u $RootUser -p < \"$SqlFile\""

# Run via cmd.exe so the input redirection works in PowerShell
$fullCmd = "cmd.exe /c \"$cmd\""

Write-Host "Executing: $cmd"
Invoke-Expression $fullCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "SQL executed successfully."
    Write-Host "If you used the placeholder password 'StrongPasswordHere' in the SQL, update the app DB user password now and place it in backend/.env before starting the backend."
} else {
    Write-Host "mysql client returned exit code $LASTEXITCODE. Check the output above for errors."
}
