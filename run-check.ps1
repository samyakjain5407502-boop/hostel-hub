param([string]$Step)

Set-Location 'c:\Users\jainj\OneDrive\Desktop\Hostel Hub'

if ($Step -eq 'tree') {
  Write-Host '=== SRC TREE (compact) ==='
  Get-ChildItem src -Recurse -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' } |
    ForEach-Object { $_.FullName.Replace((Get-Location).Path + '\src\', '') } | Sort-Object
  exit 0
}

if ($Step -eq 'tsc') {
  Write-Host '=== TS CHECK ==='
  $err = node .\node_modules\typescript\bin\tsc --noEmit 2>&1
  if ($LASTEXITCODE -eq 0) {
    Write-Host 'TYPE SCRIPT CLEAN'
  } else {
    $err | Select-Object -First 40
  }
  exit $LASTEXITCODE
}

if ($Step -eq 'brand') {
  Write-Host '=== BRAND REFERENCE SCAN ==='
  $pat = 'Medi-Caps|medicaps|Cause.*26|Cause .26|Indro|Campus|warden@medicaps'
  $files = Get-ChildItem -Recurse -File src, *.md, public -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' }
  $hits = @()
  foreach ($f in $files) {
    $txt = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    if ($txt -match $pat) {
      $hits += "$($f.Name)"
    }
  }
  if ($hits) { $hits | Sort-Object -Unique } else { Write-Host 'NO BRAND REFERENCES FOUND' }
  exit 0
}

if ($Step -eq 'i18n') {
  Write-Host '=== I18N DICT FILES ==='
  Get-ChildItem src/i18n -Filter '*.ts' |
    ForEach-Object { Write-Host "$($_.Name) : $((Get-Content $_.FullName | Measure-Object -Line).Lines) lines" }
  exit 0
}

if ($Step -eq 'ru') {
  Write-Host '=== BUILD ROUTES IN .next ==='
  if (-not (Test-Path .next)) { Write-Host 'NO .next DIR — NOT BUILT YET'; exit 0 }
  if (Test-Path .next\build\manifest.json) {
    $m = node -e "const m=require('.next/build/manifest.json'); Object.keys(m).forEach(k=>console.log('ROUTE',k))" 2>$null
    if ($m) { $m } else { Write-Host '(manifest loaded, no routes printed)' }
  } else {
    Write-Host 'NO manifest.json'
    Get-ChildItem .next -Directory -ErrorAction SilentlyContinue | Select-Object Name
  }
  exit 0
}

Write-Host "Unknown step: $Step"
exit 2
