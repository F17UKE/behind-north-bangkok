$ErrorActionPreference = 'Stop'

$backendPath = $PSScriptRoot
$workspacePath = Split-Path -Parent $backendPath
$envPath = Join-Path $backendPath '.env'
$dataPath = Join-Path $workspacePath '.postgres-data'
$envLines = @(Get-Content -LiteralPath $envPath)
$binCandidates = @(
  (Join-Path $env:ProgramFiles 'PostgreSQL\18\bin'),
  (Join-Path $workspacePath 'postgresql-runtime\bin')
)
$pgBin = $binCandidates | Where-Object {
  (Test-Path (Join-Path $_ 'initdb.exe')) -and
  (Test-Path (Join-Path (Split-Path -Parent $_) 'lib\dict_snowball.dll'))
} | Select-Object -First 1

function Set-EnvValue([string[]]$Lines, [string]$Name, [string]$Value) {
  $found = $false
  $updated = @($Lines | ForEach-Object {
    if ($_ -match "^$Name=") { $found = $true; "$Name=$Value" } else { $_ }
  })
  if (-not $found) { $updated += "$Name=$Value" }
  return ,$updated
}

if (-not $pgBin) {
  $runtimePath = Join-Path $workspacePath 'postgresql-runtime'
  $partialRoot = [IO.Path]::GetFullPath((Join-Path $env:ProgramFiles 'PostgreSQL\18'))
  $expectedPartialRoot = [IO.Path]::GetFullPath('C:\Program Files\PostgreSQL\18')
  $partialDataVersion = Join-Path $partialRoot 'data\PG_VERSION'
  $partialService = Get-CimInstance Win32_Service -Filter "Name='postgresql-x64-18'" -ErrorAction SilentlyContinue
  $serviceUsesPartial = $partialService -and $partialService.PathName.Contains($partialRoot)
  if (($partialRoot -eq $expectedPartialRoot) -and (Test-Path (Join-Path $partialRoot 'bin\initdb.exe')) -and -not (Test-Path $partialDataVersion) -and -not $serviceUsesPartial) {
    Remove-Item -LiteralPath $partialRoot -Recurse -Force
  }

  $installerTemp = Join-Path $workspacePath '.postgres-installer-tmp'
  New-Item -ItemType Directory -Path $installerTemp -Force | Out-Null
  $env:TEMP = $installerTemp
  $env:TMP = $installerTemp
  $secret = New-Object byte[] 24
  $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
  $rng.GetBytes($secret)
  $dbPassword = [BitConverter]::ToString($secret).Replace('-', '')
  $rng.Dispose()
  $envLines = Set-EnvValue $envLines 'DB_PASSWORD' $dbPassword
  Set-Content -LiteralPath $envPath -Value $envLines -Encoding utf8

  choco install postgresql18 --params "/Password:$dbPassword /Port:5432" --install-arguments "--prefix `"$runtimePath`" --enable-components server,commandlinetools" --yes --no-progress
  if ($LASTEXITCODE -ne 0) { throw "PostgreSQL server installation failed with exit code $LASTEXITCODE" }
  $pgBin = Join-Path $runtimePath 'bin'
}

$psql = Join-Path $pgBin 'psql.exe'
$initdb = Join-Path $pgBin 'initdb.exe'
$pgCtl = Join-Path $pgBin 'pg_ctl.exe'
$createdb = Join-Path $pgBin 'createdb.exe'
if (-not (Test-Path -LiteralPath $psql)) { throw "psql was not found in $pgBin" }

$passwordLine = Get-Content -LiteralPath $envPath | Where-Object { $_ -match '^DB_PASSWORD=' } | Select-Object -First 1
$dbPassword = if ($passwordLine) { $passwordLine.Substring('DB_PASSWORD='.Length) } else { '' }
if (-not $dbPassword) {
  throw 'DB_PASSWORD is missing in backend/.env.'
}

$env:PGPASSWORD = $dbPassword
$env:PGCONNECT_TIMEOUT = '5'
$service = Get-Service -Name 'postgresql-x64-18' -ErrorAction SilentlyContinue
if ($service) {
  if ($service.Status -ne 'Running') { Start-Service -Name $service.Name }
} else {
  if (-not (Test-Path -LiteralPath (Join-Path $dataPath 'PG_VERSION'))) {
    $secret = New-Object byte[] 24
    $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($secret)
    $dbPassword = [BitConverter]::ToString($secret).Replace('-', '')
    $rng.Dispose()
    $envLines = Set-EnvValue $envLines 'DB_PASSWORD' $dbPassword
    Set-Content -LiteralPath $envPath -Value $envLines -Encoding utf8
    $env:PGPASSWORD = $dbPassword

    New-Item -ItemType Directory -Path $dataPath -Force | Out-Null
    $passwordFile = Join-Path $backendPath '.postgres-init-password'
    [IO.File]::WriteAllText($passwordFile, $dbPassword + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
    try {
      & $initdb -D $dataPath -U postgres --auth=scram-sha-256 --pwfile=$passwordFile --encoding=UTF8
      if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL cluster initialization failed.' }
    } finally {
      Remove-Item -LiteralPath $passwordFile -Force -ErrorAction SilentlyContinue
    }
  }

  & $pgCtl -D $dataPath status *> $null
  if ($LASTEXITCODE -ne 0) {
    & $pgCtl -D $dataPath -l (Join-Path $dataPath 'postgres.log') -o '-h 127.0.0.1 -p 5432' start
    if ($LASTEXITCODE -ne 0) { throw 'PostgreSQL could not start. Check .postgres-data\postgres.log.' }
  }
}

$databaseExists = & $psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'behind_north_bangkok'"
if ($LASTEXITCODE -ne 0) { throw 'Could not connect to local PostgreSQL.' }
if (-not ($databaseExists -match '1')) {
  & $createdb -h 127.0.0.1 -p 5432 -U postgres behind_north_bangkok
  if ($LASTEXITCODE -ne 0) { throw 'Could not create database behind_north_bangkok.' }
}

Push-Location $backendPath
try {
  npm run db:migrate
  if ($LASTEXITCODE -ne 0) { throw 'Database migrations failed.' }
} finally {
  Pop-Location
}

& $psql -h 127.0.0.1 -p 5432 -U postgres -d behind_north_bangkok -c 'SELECT current_database(), current_user, version();'
if ($LASTEXITCODE -ne 0) { throw 'Final PostgreSQL connection check failed.' }
Write-Output 'PostgreSQL is running and the project database is ready.'
