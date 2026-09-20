$base = 'c:\Users\jainj\OneDrive\Desktop\Hostel Hub'

Write-Host '=== 1. Is the dev server still up? ==='
$conn = Get-NetTCPConnection -LocalPort 3111 -State Listen -ErrorAction SilentlyContinue
if ($conn) { Write-Host "Server on :3111 is UP" } else { Write-Host "Server on :3111 is DOWN" }

Write-Host "`n=== 2. Does the live page render footer.campus / footer.contactLine / footer.tagline2 as LITERAL text? ==="
try {
  $html = Invoke-WebRequest -Uri 'http://localhost:3111/' -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
  $body = $html.Content
  foreach ($k in 'footer.campus','footer.contactLine','footer.tagline2') {
    if ($body -match [regex]::Escape($k)) {
      Write-Host "  $k RENDERS AS LITERAL ON PAGE (bug)" -ForegroundColor Red
    } else {
      Write-Host "  $k not found as literal (OK or server-side rendered differently)"
    }
  }
} catch {
  Write-Host "  Could not fetch page: $_"
}

Write-Host "`n=== 3. Is landing.hero.ctaSecondary used in any TSX file? ==="
Get-ChildItem -Recurse $base/src -Include *.tsx -File | Select-String -Pattern "ctaSecondary" -ErrorAction SilentlyContinue |
  ForEach-Object { "$($_.Path.Replace("$base\",""))=>L$($_.LineNumber)" }

Write-Host "`n=== 4. app.institute in hi4/hi5/hing4/hing5 ==="
foreach ($f in 'src/i18n/hi4.ts','src/i18n/hi5.ts','src/i18n/hinglish4.ts','src/i18n/hinglish5.ts') {
  $r = Select-String -Path (Join-Path $base $f) -Pattern "'app\.institute'" -SimpleMatch -ErrorAction SilentlyContinue
  if ($r) { Write-Host "$f :L$($r.LineNumber)  $($r.Line.Trim())" } else { Write-Host "$f : (not present)" }
}

Write-Host "`n=== 5. GraduationCap import + usage across src ==="
Get-ChildItem -Recurse $base/src -Include *.tsx,*.ts -File | Select-String -Pattern "GraduationCap" -ErrorAction SilentlyContinue |
  ForEach-Object { "$($_.Path.Replace("$base\",""))=>L$($_.LineNumber) $($_.Line.Trim())" }
