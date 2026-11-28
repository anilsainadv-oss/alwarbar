# Calls the local court-sync endpoint. Run by Windows Task Scheduler.
# Requires: `npm run dev` (or `npm run start`) running on port 3001, and CRON_SECRET in .env.local
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$envFile = Join-Path $projectRoot '.env.local'
$logFile = Join-Path $projectRoot 'data\court-sync.log'

$secret = $null
foreach ($line in Get-Content $envFile) {
  if ($line -match '^\s*CRON_SECRET\s*=\s*(.+)$') { $secret = $Matches[1].Trim().Trim('"') }
}
if (-not $secret) { "$(Get-Date -Format s) ERROR CRON_SECRET missing in .env.local" | Add-Content $logFile; exit 1 }

try {
  $res = Invoke-RestMethod -Method Post -Uri 'http://localhost:3001/api/cron/court-sync' `
    -Headers @{ Authorization = "Bearer $secret" } -ContentType 'application/json' `
    -Body '{"court":"supreme_court"}' -TimeoutSec 600
  "$(Get-Date -Format s) OK new=$($res.summary.newlyIngestedCount) dup=$($res.summary.skippedDuplicatesCount) failed=$($res.summary.failedDownloadsCount) sc=$($res.supremeCourtStatus.status) $($res.supremeCourtStatus.lastErrorMessage)" | Add-Content $logFile
} catch {
  "$(Get-Date -Format s) ERROR $($_.Exception.Message)" | Add-Content $logFile
  exit 1
}
