param(
  [string]$ProjectRoot = (Split-Path $PSScriptRoot)
)

$dictFiles = @(
  'src/i18n/en.ts','src/i18n/en2.ts','src/i18n/en3.ts','src/i18n/en4.ts',
  'src/i18n/hi.ts','src/i18n/hi2.ts','src/i18n/hi3.ts','src/i18n/hi4.ts',
  'src/i18n/hinglish.ts','src/i18n/hinglish2.ts','src/i18n/hinglish3.ts','src/i18n/hinglish4.ts'
)

$pattern = [regex]::new("'([a-zA-Z0-9._~\\-]+)':")
$defined = [System.Collections.Generic.HashSet[string]]::new()
foreach ($f in $dictFiles) {
  $path = Join-Path $ProjectRoot $f
  if (Test-Path $path) {
    foreach ($m in $pattern.Matches((Get-Content $path -Raw))) {
      $null = $defined.Add($m.Groups[1].Value)
    }
  }
}

$tCall = [regex]::new("t\('([a-zA-Z0-9._~\\-]+)'")
$tmplCall = [regex]::new("t\(`([a-zA-Z0-9._~\\-]+)\.")
$used = [System.Collections.Generic.HashSet[string]]::new()

Get-ChildItem -Recurse -Path (Join-Path $ProjectRoot 'src') -Include '*.tsx','*.ts' -ErrorAction SilentlyContinue | ForEach-Object {
  foreach ($m in $tCall.Matches($_.Content)) { $null = $used.Add($m.Groups[1].Value) }
  foreach ($m in $tmplCall.Matches($_.Content)) { $null = $used.Add($m.Groups[1].Value) }
}

$miss = [System.Collections.Generic.List[string]]::new()
foreach ($k in $used) { if (-not $defined.Contains($k)) { $miss.Add($k) } }

Write-Host "=== Dictionary coverage ==="
Write-Host "Unique keys defined : $($defined.Count)"
Write-Host "Unique t(…) keys used (literal+tpl): $($used.Count)"
Write-Host "Keys in code missing from dictionary : $($miss.Count)"
if ($miss.Count -gt 0) {
  Write-Host "--- Missing keys ---"
  $miss | Sort-Object | ForEach-Object { Write-Host $_ }
}
exit 0