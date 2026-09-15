<#
.SYNOPSIS
  Build and deploy the frontend to Firebase Hosting (manual deploy for the client).

.DESCRIPTION
  Installs frontend dependencies if missing, builds the app with Vite, then
  deploys the dist output to Firebase Hosting on project attendance-client-f4541.

.EXAMPLE
  .\deploy_to_frontend.ps1
#>

param(
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$ProjectId = 'attendease-c4e07'

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# ---- 1. Preflight ----
Write-Step "Preflight"
if (-not (Get-Command npm -ErrorAction SilentlyContinue))      { throw "npm not found. Install Node.js from https://nodejs.org" }
if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) { throw "Firebase CLI not found. Install with: npm install -g firebase-tools" }

# ---- 2. Install dependencies (if missing) ----
Write-Step "Installing frontend dependencies"
Push-Location (Join-Path $PSScriptRoot 'frontend')
try {
  if (-not (Test-Path 'node_modules')) {
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed (exit code $LASTEXITCODE)" }
  }
} finally {
  Pop-Location
}

# ---- 3. Build ----
if ($WhatIf) {
  Write-Step "Building frontend (WhatIf - skipped)"
  Write-Host "Would run: npm run build"
} else {
  Write-Step "Building frontend"
  Push-Location (Join-Path $PSScriptRoot 'frontend')
  try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Build failed (exit code $LASTEXITCODE)" }
  } finally {
    Pop-Location
  }
}

# ---- 4. Deploy to Firebase Hosting ----
if ($WhatIf) {
  Write-Step "Deploying to Firebase Hosting (WhatIf - skipped)"
  Write-Host "Would run: firebase deploy --only hosting --project $ProjectId"
} else {
  Write-Step "Deploying to Firebase Hosting"
  firebase deploy --only hosting --project $ProjectId
  if ($LASTEXITCODE -ne 0) { throw "Firebase deploy failed (exit code $LASTEXITCODE)" }
}

Write-Host "`nDeployed! Live at: https://$ProjectId.web.app" -ForegroundColor Green
Write-Host "Firebase console: https://console.firebase.google.com/project/$ProjectId" -ForegroundColor Cyan
