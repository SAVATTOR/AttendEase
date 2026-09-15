<#
.SYNOPSIS
  Deploy the backend to Render (manual deploy for the client).

.DESCRIPTION
  Commits and pushes local backend changes to the main branch, then triggers a
  Render deploy using the service's Deploy Hook URL.

  The hook URL is resolved in this order:
    1. -HookUrl parameter
    2. RENDER_DEPLOY_HOOK_URL environment variable
    3. .render-deploy-hook file in this folder (created on first run)
    4. Interactive prompt (saved to .render-deploy-hook)

.EXAMPLE
  .\deploy_to_render.ps1
  .\deploy_to_render.ps1 -HookUrl "https://api.render.com/deploy/srv-xxx?key=yyy"
  .\deploy_to_render.ps1 -SkipGitPush
#>

param(
  [string]$HookUrl,
  [switch]$SkipGitPush,
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'

function Write-Step($msg) { Write-Host "`n=== $msg ===" -ForegroundColor Cyan }

# ---- 1. Resolve the Render Deploy Hook URL ----
Write-Step "Resolving Render Deploy Hook URL"

$hook = $HookUrl
if (-not $hook) { $hook = $env:RENDER_DEPLOY_HOOK_URL }
if (-not $hook) {
  $cacheFile = Join-Path $PSScriptRoot '.render-deploy-hook'
  if (Test-Path $cacheFile) {
    $hook = (Get-Content $cacheFile -Raw).Trim()
    Write-Host "Using hook URL from $cacheFile"
  }
}
if (-not $hook) {
  $hook = Read-Host "Paste your Render Deploy Hook URL`n(Render dashboard -> your backend service -> Settings -> Deploy Hook)"
  if ($hook) {
    $save = Read-Host "Save it for next time? (y/N)"
    if ($save -eq 'y') {
      Set-Content -Path (Join-Path $PSScriptRoot '.render-deploy-hook') -Value $hook -NoNewline
      Write-Host "Saved to .render-deploy-hook (it is git-ignored)." -ForegroundColor Yellow
    }
  }
}

if ($hook -notmatch 'api\.render\.com/deploy') {
  throw "That does not look like a Render Deploy Hook URL (expected https://api.render.com/deploy/...). Got: $hook"
}

# ---- 2. Push latest code to GitHub ----
if ($WhatIf) {
  Write-Step "Committing and pushing changes to main (WhatIf - skipped)"
  Write-Host "Would run: git add backend supabase; git commit; git push origin main"
} elseif (-not $SkipGitPush) {
  Write-Step "Committing and pushing changes to main"
  Push-Location $PSScriptRoot
  try {
    git add backend supabase
    $dirty = git status --porcelain
    if ($dirty) {
      if (-not (git config user.email)) { git config user.email "render-deploy@users.noreply.github.com" }
      if (-not (git config user.name))  { git config user.name  "Render Deploy" }
      git commit -m "Deploy backend to Render"
    } else {
      Write-Host "No new backend changes to commit."
    }
    git push origin main
    if ($LASTEXITCODE -ne 0) { throw "git push failed (exit code $LASTEXITCODE)" }
  } finally {
    Pop-Location
  }
}

# ---- 3. Trigger the Render deploy ----
Write-Step "Triggering Render deploy"
if ($WhatIf) {
  Write-Host "WhatIf: would POST to $hook"
} else {
  $result = Invoke-RestMethod -Method Post -Uri $hook
  $result | ConvertTo-Json -Depth 5
}

Write-Host "`nRender deploy triggered successfully." -ForegroundColor Green
Write-Host "Track the deploy at:      https://dashboard.render.com" -ForegroundColor Cyan
Write-Host "Backend health check:     https://attendance-system-client-jk9s.onrender.com/api/health" -ForegroundColor Cyan
