<#  deploy.ps1 — деплой фронтенда на Netlify через CLI + автододавання _redirects
    Вимоги: Node.js >= 18, npm. Під час першого запуску скрипт поставить Netlify CLI,
    відкриє login у браузері та запропонує link до існуючого сайту.
#>

param(
  [switch]$Preview,                      # якщо вказано — робить прев'ю деплой (без --prod)
  [switch]$Zip,                          # додатково зібрати ZIP із вмістом frontend
  [string]$RenderApi = "https://designer-shifttime.onrender.com", # бекенд
  [string]$FrontendRel = "frontend",     # тека, яку публікуємо
  [string]$SiteId                        # опційно: NETLIFY_SITE_ID (щоб link без меню)
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

# 1) Перевіримо, що є папка frontend
$front = Join-Path $root $FrontendRel
if (!(Test-Path $front)) { throw "Frontend dir not found: $front" }

# 2) Гарантуємо файл redirects у frontend (працює і для CLI, і для Drag&Drop)
$redirectsPath = Join-Path $front "_redirects"
$redirectsText = "/api/*  $RenderApi/api/:splat  200!`n/*      /index.html            200`n"
if (!(Test-Path $redirectsPath) -or ((Get-Content $redirectsPath -Raw) -ne $redirectsText)) {
  $null = New-Item -ItemType File -Path $redirectsPath -Force
  Set-Content -Path $redirectsPath -Value $redirectsText -Encoding UTF8
  Write-Host "[OK] _redirects updated: $redirectsPath"
} else {
  Write-Host "[OK] _redirects already up-to-date"
}

# 3) Перевіримо Node та Netlify CLI
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js is not installed. Install from https://nodejs.org and run again."
}
if (-not (Get-Command netlify -ErrorAction SilentlyContinue)) {
  Write-Host "[INFO] Installing Netlify CLI globally..."
  npm install -g netlify-cli | Out-Null
}

# 4) Авторизація і лінкування сайту (one-time)
if (-not $env:NETLIFY_AUTH_TOKEN) {
  Write-Host "[INFO] Opening Netlify login..."
  netlify login | Out-Null
}
if ($SiteId) {
  netlify link --id $SiteId
} elseif (-not (Test-Path ".netlify/state.json")) {
  Write-Host "[INFO] Linking local folder to an existing Netlify site..."
  netlify link
}

# 5) Деплой
$ts = Get-Date -Format "yyyy-MM-dd HH:mm"
$cmd = @("deploy","--dir",$front,"--message","deploy $ts")
if (-not $Preview) { $cmd += "--prod" }

Write-Host "[RUN] netlify $($cmd -join ' ')"
& netlify @cmd

# 6) (опційно) Підготувати ZIP на випадок ручного Drag&Drop
if ($Zip) {
  $outDir = Join-Path $root "dist"
  if (!(Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
  $zip = Join-Path $outDir ("frontend-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".zip")
  if (Test-Path $zip) { Remove-Item $zip -Force }
  Compress-Archive -Path (Join-Path $front "*") -DestinationPath $zip -Force
  Write-Host "[OK] ZIP created: $zip"
}

Write-Host "[DONE] Deploy completed."
