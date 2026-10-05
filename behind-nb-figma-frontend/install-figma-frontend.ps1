$ErrorActionPreference = "Stop"

$root = (Get-Location).Path
$frontend = Join-Path $root "frontend"
$sourceApp = Join-Path $root "behind-nb-figma-frontend\app"

if (-not (Test-Path $frontend)) {
    Write-Host "ERROR: frontend folder not found: $frontend"
    exit 1
}

if (-not (Test-Path $sourceApp)) {
    Write-Host "ERROR: source app folder not found: $sourceApp"
    exit 1
}

$targetApp = Join-Path $frontend "app"

if (-not (Test-Path $targetApp)) {
    $targetApp = Join-Path $frontend "src\app"
}

if (-not (Test-Path $targetApp)) {
    Write-Host "ERROR: Next.js app folder not found."
    Write-Host "Expected frontend\app or frontend\src\app"
    exit 1
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backup = Join-Path $frontend ("app-backup-" + $stamp)

Write-Host "Target App Router:"
Write-Host $targetApp
Write-Host "Backup:"
Write-Host $backup

New-Item -ItemType Directory -Path $backup -Force | Out-Null
Copy-Item -Path (Join-Path $targetApp "*") -Destination $backup -Recurse -Force

Copy-Item -Path (Join-Path $sourceApp "*") -Destination $targetApp -Recurse -Force

$cache = Join-Path $frontend ".next"
if (Test-Path $cache) {
    Remove-Item -Path $cache -Recurse -Force
}

Write-Host ""
Write-Host "Installed."
Write-Host "No package.json or package-lock.json was changed."
Write-Host ""
Write-Host "Run from project root:"
Write-Host "npm run dev"
Write-Host ""
Write-Host "Open:"
Write-Host "http://localhost:3000"
