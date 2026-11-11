param(
  [switch]$InstallApps,
  [switch]$SkipNpm
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$TomlPath = Join-Path $RepoRoot "setup.toml"

function Read-SimpleToml($Path) {
  $data = @{}
  $section = "root"
  foreach ($rawLine in (Get-Content -Path $Path -Encoding UTF8)) {
    $line = $rawLine.Trim()
    if (-not $line -or $line.StartsWith("#")) { continue }
    if ($line -match '^\[([^\]]+)\]$') {
      $section = $Matches[1].Trim()
      if (-not $data.ContainsKey($section)) { $data[$section] = @{} }
      continue
    }
    if ($line -match '^([A-Za-z0-9_]+)\s*=\s*(.+)$') {
      $key = $Matches[1].Trim()
      $val = ($Matches[2] -replace '\s+#.*$', '').Trim()
      if ($val.StartsWith('"') -and $val.EndsWith('"')) {
        $val = $val.Substring(1, $val.Length - 2).Replace('\\', '\')
      }
      if (-not $data.ContainsKey($section)) { $data[$section] = @{} }
      $data[$section][$key] = $val
    }
  }
  return $data
}

function Find-Node22Plus {
  $candidates = @()
  $localTools = Join-Path $RepoRoot ".tools\node22\node.exe"
  if (Test-Path $localTools) { $candidates += $localTools }
  $backupTools = "C:\sites\single_site_agent\.tools\node22\node.exe"
  if (Test-Path $backupTools) { $candidates += $backupTools }
  $cmd = Get-Command node -ErrorAction SilentlyContinue
  if ($cmd) { $candidates += $cmd.Source }

  foreach ($exe in $candidates) {
    try {
      $ver = (& $exe -p "process.versions.node.split('.')[0]" 2>$null).Trim()
      if ([int]$ver -ge 22) { return $exe }
    } catch {}
  }
  return $null
}

function Find-FfmpegExe {
  $wingetRoot = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
  if (Test-Path $wingetRoot) {
    $found = Get-ChildItem -Path $wingetRoot -Filter "ffmpeg.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { return $found.FullName }
  }
  $cmd = Get-Command ffmpeg -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }
  return $null
}

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host " Autonomous Real Estate Reels - Setup (setup.toml)" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

$cfg = Read-SimpleToml $TomlPath
$wingetCmd = Get-Command winget -ErrorAction SilentlyContinue

# 1. Node.js 22+
$node22 = Find-Node22Plus
if ($node22) {
  $nodeVer = (& $node22 --version).Trim()
  Write-Host "[OK] Node.js 22+ found: $nodeVer ($node22)" -ForegroundColor Green
} else {
  $pkg = $cfg["winget"]["node_lts"]
  Write-Host "[MISSING] Node.js 22+ is required by HyperFrames." -ForegroundColor Yellow
  if ($InstallApps -and $wingetCmd) {
    Write-Host "Installing $pkg via winget..."
    winget install --id $pkg -e --silent --accept-package-agreements --accept-source-agreements
    $node22 = Find-Node22Plus
  } else {
    Write-Host "Run: winget install --id $pkg -e  (or re-run .\setup.ps1 -InstallApps)" -ForegroundColor Yellow
  }
}

# 2. Full FFmpeg + FFprobe
$ffmpeg = Find-FfmpegExe
if ($ffmpeg) {
  Write-Host "[OK] FFmpeg found: $ffmpeg" -ForegroundColor Green
} else {
  $pkg = $cfg["winget"]["ffmpeg"]
  Write-Host "[MISSING] Full FFmpeg not found." -ForegroundColor Yellow
  if ($InstallApps -and $wingetCmd) {
    Write-Host "Installing $pkg via winget..."
    winget install --id $pkg -e --silent --accept-package-agreements --accept-source-agreements
    $ffmpeg = Find-FfmpegExe
  } else {
    Write-Host "Run: winget install --id $pkg -e  (or re-run .\setup.ps1 -InstallApps)" -ForegroundColor Yellow
  }
}

# 3. DaVinci Resolve check
$resolveExe = $cfg["winget_optional"]["davinci_resolve"]
if ($resolveExe -and (Test-Path $resolveExe)) {
  Write-Host "[OK] DaVinci Resolve found: $resolveExe" -ForegroundColor Green
} else {
  Write-Host "[INFO] DaVinci Resolve optional (MP4 rendering still works without it)." -ForegroundColor DarkGray
}

# 4. Install Node dependencies locally (hyperframes, gsap, msedge-tts)
if (-not $SkipNpm) {
  $npmCmd = Get-Command npm -ErrorAction SilentlyContinue
  $envPath = $env:PATH
  if ($node22) { $env:PATH = "$(Split-Path $node22);$envPath" }
  if ($npmCmd -or $node22) {
    Write-Host "`nInstalling package.json dependencies (hyperframes, gsap, msedge-tts)..." -ForegroundColor Cyan
    Push-Location $RepoRoot
    try {
      npm install
      if ($LASTEXITCODE -ne 0) { throw "npm install failed with exit code $LASTEXITCODE" }
    } finally {
      Pop-Location
      $env:PATH = $envPath
    }
  } else {
    Write-Error "npm / Node not available. Install Node.js first via .\setup.ps1 -InstallApps"
  }
}

# 5. Ensure Kannada system fonts are mirrored into common/fonts if available
$fontTarget = Join-Path $RepoRoot ($cfg["fonts"]["target_dir"] -replace '/', '\')
New-Item -ItemType Directory -Force -Path $fontTarget | Out-Null
foreach ($f in @("NIRMALA.TTF", "NIRMALAB.TTF")) {
  $srcFont = Join-Path $cfg["fonts"]["system_dir"] $f
  $dstFont = Join-Path $fontTarget $f
  if ((Test-Path $srcFont) -and -not (Test-Path $dstFont)) {
    Copy-Item -Path $srcFont -Destination $dstFont -Force
    Write-Host "[OK] Copied font -> $dstFont" -ForegroundColor Green
  }
}

# 6. Deploy DaVinci Resolve Utility script
$resolveSrc = Join-Path $RepoRoot ($cfg["resolve"]["utility_script_src"] -replace '/', '\')
$resolveDir = Join-Path $env:APPDATA $cfg["resolve"]["utility_dir_rel"]
if ((Test-Path $resolveSrc) -and (Test-Path (Split-Path -Parent $resolveDir))) {
  New-Item -ItemType Directory -Force -Path $resolveDir | Out-Null
  $resolveDst = Join-Path $resolveDir $cfg["resolve"]["utility_script_name"]
  $srcText = (Get-Content -Path $resolveSrc -Raw -Encoding UTF8).Replace('__REPO_ROOT__', $RepoRoot.Replace('\', '\\'))
  Set-Content -Path $resolveDst -Value $srcText -Encoding UTF8
  Write-Host "[OK] Deployed DaVinci Resolve Script -> $resolveDst" -ForegroundColor Green
}

Write-Host "`nSetup complete! Quick usage:" -ForegroundColor Green
Write-Host "  1) Drop your transparent PNG/SVG logo in: common\logo\logo.png"
Write-Host "  2) Create a new site folder:             npm run new -- 2026-11-11_my_layout"
Write-Host "  3) Drop recorded MP4s in:                sites\2026-11-11_my_layout\clips\"
Write-Host "  4) Edit 5-step site details:             sites\2026-11-11_my_layout\site.json"
Write-Host "  5) Prepare, preview & render reel:       npm run prep -- sites/2026-11-11_my_layout && npm run studio -- sites/2026-11-11_my_layout"
