$q = @(
  'landing.hero.allPortals',
  'landing.hero.badge',
  'landing.hero.ctaSecondary',
  'nav.adminColleges',
  'nav.mgmtOperators',
  'footer.tagline2',
  'footer.campus',
  'footer.contactLine'
)
$root = 'c:\Users\jainj\OneDrive\Desktop\Hostel Hub\src'
foreach ($k in $q) {
  $hits = Get-ChildItem -Recurse -Path $root -Include *.tsx,*.ts -File |
    Select-String -Pattern ([regex]::Escape($k)) -ErrorAction SilentlyContinue
  if ($hits) {
    Write-Host "$k => HITS:"
    foreach ($h in $hits) {
      $p = $h.Path.Replace($root, '').TrimStart('\')
      Write-Host "  $p=>L$($h.LineNumber) $($h.Line.Trim())"
    }
  } else {
    Write-Host "$k => NO HITS"
  }
}

Write-Host "`n=== college-select full ==="
Get-Content "$root/components/auth/college-select.tsx"

Write-Host "`n=== footer page: contactLine/tagline2/campus current text? ==="
foreach ($f in 'en5.ts','en6.ts') {
  Write-Host "--- $f ---"
  Select-String -Path "$root/i18n/$f" -Pattern "'footer\.(tagline2|campus|contactLine|rights|brandLine|platform|contact|messPlanning|rewards|complaintCenter|docs|ecoGuide|privacy|backToTop|learning)'" | ForEach-Object { $_.Line.Trim() }
}

Write-Host "`n=== GraduationCap refs ==="
Get-ChildItem -Recurse -Path $root -Include *.tsx,*.ts -File |
  Select-String -Pattern 'GraduationCap' |
  ForEach-Object { "$($_.Path.Replace($root,'').TrimStart('\'))=>L$($_.LineNumber)" }

Write-Host "`n=== trust.tsx PARTNERS + title ==="
Get-Content "$root/components/landing/trust.tsx"
