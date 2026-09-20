$lines = Get-Content 'src/i18n/en6.ts'
Write-Host '--- L7-19 (portal nav section) ---'
$lines[6..18] | ForEach-Object { Write-Host "$($_.ReadCount): $($_.Trim())" }
Write-Host '--- L157-168 (hero badge / ctaSecondary area) ---'
$lines[156..167] | ForEach-Object { Write-Host "$($_.ReadCount): $($_.Trim())" }
Write-Host '--- L210-226 (footer / brand area) ---'
$lines[209..225] | ForEach-Object { Write-Host "$($_.ReadCount): $($_.Trim())" }
Write-Host '--- L159 exact bytes (landing.badge) ---'
Write-Host "Line159 = [$($lines[158])]"
Write-Host "Char codes: $([string]::Join(' ', ($lines[158].ToCharArray() | ForEach-Object { [int]$_ })))"
