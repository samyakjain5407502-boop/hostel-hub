function Get-Short($p, $base) {
  $p.Replace($base, '').TrimStart('\')
}

$base = 'c:\Users\jainj\OneDrive\Desktop\Hostel Hub'

Write-Host '=== 1. Dev server on :3111 ==='
$conn = Get-NetTCPConnection -LocalPort 3111 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Write-Host '  UP' } else { Write-Host '  DOWN' }

Write-Host "`n=== 2. Live page literals? ==="
try {
  $html = Invoke-WebRequest -Uri 'http://localhost:3111/' -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
  $body = $html.Content
  if ($body -match 'footer\.campus') { Write-Host '  footer.campus -> LITERAL (bug)' -ForegroundColor Red }
  if ($body -match 'footer\.contactLine') { Write-Host '  footer.contactLine -> LITERAL (bug)' -ForegroundColor Red }
  if ($body -match 'footer\.tagline2') { Write-Host '  footer.tagline2 -> LITERAL (bug)' -ForegroundColor Red }
} catch {
  Write-Host "  fetch failed: $_"
}

Write-Host '`n=== 3. ctaSecondary in TSX? ==='
Get-ChildItem -Recurse "$base/src" -Include *.tsx -File |
  Select-String -Pattern 'ctaSecondary' -SimpleMatch -ErrorAction SilentlyContinue |
  ForEach-Object { Write-Host "  $($_.Path.Replace($base,'').TrimStart('\')) => L$($_.LineNumber)" }

Write-Host '`n=== 4. GraduationCap refs ==='
Get-ChildItem -Recurse "$base/src" -Include *.tsx,*.ts -File |
  Select-String -Pattern 'GraduationCap' -SimpleMatch -ErrorAction SilentlyContinue |
  ForEach-Object { Write-Host "  $($_.Path.Replace($base,'').TrimStart('\')) => L$($_.LineNumber)  $($_.Line.Trim())" }
