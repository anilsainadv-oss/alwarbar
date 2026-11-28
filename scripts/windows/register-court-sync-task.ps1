# One-time setup (run PowerShell as your normal user):  .\scripts\windows\register-court-sync-task.ps1
$script = Join-Path $PSScriptRoot 'run-court-sync.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""
# Twice a day (09:00 and 21:00) - gentle on the court server and enough for "latest" judgments
$t1 = New-ScheduledTaskTrigger -Daily -At 9:00AM
$t2 = New-ScheduledTaskTrigger -Daily -At 9:00PM
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -AllowStartIfOnBatteries
Register-ScheduledTask -TaskName 'AlwarCourtSync' -Action $action -Trigger @($t1,$t2) -Settings $settings -Force
Write-Host 'Task AlwarCourtSync registered. Test now with: Start-ScheduledTask -TaskName AlwarCourtSync ; then check data\court-sync.log'
