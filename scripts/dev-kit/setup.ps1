<#
.SYNOPSIS
Sets up this copy of Open File for development, from the dev kit alone, with no network.

.DESCRIPTION
Checks that Node.js and Go are installed at a version that works, then:
  - installs the npm packages of the app and of relay/ from offline\npm-cache (npm ci --offline);
  - installs the engine and the human-like opponent's model into public\ from offline\files,
    checking their pinned SHA-256 checksums (scripts/setup-engine.mjs and setup-maia.mjs --from);
  - points Playwright at the headless Chromium in offline\files\ms-playwright, for this window
    (PLAYWRIGHT_BROWSERS_PATH).
It ends with the commands to build and test. It can be run again at any time.

Works in Windows PowerShell 5.1 and PowerShell 7. From the kit's folder:
    Set-ExecutionPolicy -Scope Process Bypass
    .\offline\setup.ps1

Its source is scripts/dev-kit/setup.ps1, copied into the kit by scripts/build-dev-kit.mjs.
#>
[CmdletBinding()]
param()

Set-StrictMode -Version 2.0
$ErrorActionPreference = 'Stop'

$offline = $PSScriptRoot
$root = Split-Path -Parent $offline
$kit = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $offline 'kit.json') | ConvertFrom-Json

function Write-Step([string]$text) {
  Write-Host ''
  Write-Host "== $text"
}

# A version's first three numbers as a [version] ("v22.23.4", "go1.24.13", "1.24"), or $null.
function ConvertTo-Version([string]$text) {
  $match = [regex]::Match($text, '(\d+)\.(\d+)(?:\.(\d+))?')
  if (-not $match.Success) { return $null }
  $patch = 0
  if ($match.Groups[3].Success) { $patch = [int]$match.Groups[3].Value }
  return New-Object System.Version ([int]$match.Groups[1].Value), ([int]$match.Groups[2].Value), $patch
}

# The program a command runs (an .exe or .cmd on the PATH), or $null.
function Find-Program([string]$name) {
  $found = Get-Command $name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $found) { return $null }
  return $found.Source
}

# What a program prints, trimmed, or $null when it fails.
function Get-Output([string]$program, [string[]]$arguments) {
  $stop = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    $out = & $program @arguments 2>$null
    if ($LASTEXITCODE -ne 0) { return $null }
    return ($out | Out-String).Trim()
  } catch {
    return $null
  } finally {
    $ErrorActionPreference = $stop
  }
}

# Runs a program in a folder, and stops the setup when it fails: on its exit code, not on what it
# writes to stderr (npm's warnings), which Windows PowerShell 5.1 turns into errors when the
# script's output is redirected.
function Invoke-Program([string]$program, [string[]]$arguments, [string]$folder) {
  Push-Location -LiteralPath $folder
  $stop = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try {
    & $program @arguments
    if ($LASTEXITCODE -ne 0) {
      throw "$(Split-Path -Leaf $program) $($arguments -join ' ') failed (exit code $LASTEXITCODE)."
    }
  } finally {
    $ErrorActionPreference = $stop
    Pop-Location
  }
}

function Get-Toolchain([string]$command) {
  foreach ($tool in $kit.toolchains) {
    if ($tool.command -eq $command) { return $tool }
  }
  throw "kit.json names no $command"
}

Write-Host "Open File $($kit.version): setting up the dev kit in $root"

# ---------------------------------------------------------------------------------------------
Write-Step 'Toolchains'

$missing = New-Object System.Collections.Generic.List[string]

$nodeTool = Get-Toolchain 'node'
$node = Find-Program 'node'
$npm = Find-Program 'npm'
$nodeVersion = $null
if ($null -ne $node) { $nodeVersion = ConvertTo-Version (Get-Output $node @('--version')) }
if ($null -eq $nodeVersion) {
  $missing.Add("Node.js is not installed, or not on the PATH. Install Node.js $($nodeTool.version) (the version CI uses): $($nodeTool.url)")
} elseif ($nodeVersion -lt (ConvertTo-Version $nodeTool.minimum)) {
  $missing.Add("Node.js $nodeVersion is too old: Open File needs $($nodeTool.minimum) or newer. Install Node.js $($nodeTool.version) (the version CI uses): $($nodeTool.url)")
} elseif ($null -eq $npm) {
  $missing.Add("npm is not on the PATH (it comes with Node.js). Reinstall Node.js $($nodeTool.version): $($nodeTool.url)")
} else {
  $npmVersion = Get-Output $npm @('--version')
  Write-Host "  Node.js $nodeVersion and npm $npmVersion (CI uses Node.js $($nodeTool.version) and npm $($nodeTool.npm); $($nodeTool.minimum) or newer works)"
}
$nodeReady = $missing.Count -eq 0

$goTool = Get-Toolchain 'go'
$go = Find-Program 'go'
$goVersion = $null
if ($null -ne $go) { $goVersion = ConvertTo-Version (Get-Output $go @('env', 'GOVERSION')) }
if ($null -eq $goVersion) {
  $missing.Add("Go is not installed, or not on the PATH; $($goTool.for) need it. Install Go $($goTool.version) (the version CI uses): $($goTool.url)")
} elseif ($goVersion -lt (ConvertTo-Version $goTool.minimum)) {
  $missing.Add("Go $goVersion is too old: the launcher needs $($goTool.minimum) or newer. Install Go $($goTool.version) (the version CI uses): $($goTool.url)")
} else {
  Write-Host "  Go $goVersion (CI uses $($goTool.version); $($goTool.minimum) or newer works)"
}

if (-not $nodeReady) {
  Write-Host ''
  Write-Host 'Nothing is installed yet. First:'
  foreach ($line in $missing) { Write-Host "  - $line" }
  Write-Host 'Then run this again.'
  exit 1
}

# ---------------------------------------------------------------------------------------------
$cache = Join-Path $offline $kit.npm.cache
foreach ($project in $kit.npm.projects) {
  $folder = Join-Path $root $project
  $name = 'the app'
  if ($project -ne '.') { $name = "$project/" }
  Write-Step "npm packages for $name (npm ci --offline, from offline\$($kit.npm.cache))"
  Invoke-Program $npm @('ci', '--offline', '--cache', $cache, '--ignore-scripts', '--no-audit', '--no-fund') $folder
}

# ---------------------------------------------------------------------------------------------
Write-Step 'The engine and the human-like opponent (from offline\files, checksums checked)'
Invoke-Program $node @('scripts/setup-engine.mjs', '--from', (Join-Path $offline $kit.files.engine)) $root
Invoke-Program $node @('scripts/setup-maia.mjs', '--from', (Join-Path $offline $kit.files.maia)) $root

# ---------------------------------------------------------------------------------------------
Write-Step 'The browser for the end-to-end tests'
$browsers = Join-Path $offline $kit.playwright.browsersPath
$env:PLAYWRIGHT_BROWSERS_PATH = $browsers
$installed = Get-Content -Raw -Encoding UTF8 -LiteralPath (Join-Path $root 'node_modules\@playwright\test\package.json') | ConvertFrom-Json
if ($installed.version -ne $kit.playwright.version) {
  $missing.Add("node_modules has Playwright $($installed.version), but the kit's browser is for $($kit.playwright.version).")
}
foreach ($browser in $kit.playwright.browsers) {
  $marker = Join-Path (Join-Path $browsers $browser.folder) 'INSTALLATION_COMPLETE'
  if (Test-Path -LiteralPath $marker) {
    Write-Host "  $($browser.name): $(Join-Path $browsers $browser.folder)"
  } else {
    $missing.Add("The kit's $($browser.name) is missing from $browsers. Unzip the kit again.")
  }
}
Write-Host "  PLAYWRIGHT_BROWSERS_PATH is $browsers in this window."

# ---------------------------------------------------------------------------------------------
Write-Host ''
if ($missing.Count -gt 0) {
  Write-Host 'Set up, but for:'
  foreach ($line in $missing) { Write-Host "  - $line" }
  exit 1
}

Write-Host "Open File $($kit.version) is set up, with nothing downloaded. Next, in this folder:"
Write-Host ''
Write-Host '  npm run check                                     lint, dead code, format, types, unit tests, build, budgets'
Write-Host '  npx playwright test --project=desktop-chromium    end-to-end tests, against the build'
Write-Host '  cd launcher; go vet ./...; go test ./...; cd ..   the launcher'
Write-Host '  npm run dev                                       the app on http://localhost:5173'
Write-Host ''
Write-Host 'In another PowerShell window, point Playwright at the kit first:'
Write-Host "  `$env:PLAYWRIGHT_BROWSERS_PATH = '$browsers'"
Write-Host 'and npm ci again with:'
Write-Host "  npm ci --offline --cache '$cache' --ignore-scripts --no-audit --no-fund"
exit 0
