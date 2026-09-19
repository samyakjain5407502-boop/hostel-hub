#!/usr/bin/env pwsh
$base = 'C:\Users\jainj\OneDrive\Desktop\Hostel Hub'
Set-Location $base

Write-Host '=== TS CHECK ==='
tsc = node .\node_modules\typescript\bin\tsc --noEmit 2>&1
if ($LASTEXITCODE -eq 0) { Write-Host 'TS CLEAN' } else { Write-Host $tsc }

Write-Host ''
Write-Host '=== APP ROUTES (pages + layouts) ==='
Get-ChildItem src/app -Recurse -Include 'page.tsx','layout.tsx' | ForEach-Object { $_.FullName.Replace("$base\src\app\","") } | Sort-Object

Write-Host ''
Write-Host '=== I18N FILES ==='
Get-ChildItem src/i18n -Filter '*.ts' | Select-Object Name, @{N='Lines';E={(Get-Content $_.FullName).Count}} | Format-Table -AutoSize

Write-Host ''
Write-Host '=== BRAND REFERENCES (should be NONE) ==='
Select-String -Path 'src/**/*.tsx','src/**/*.ts','*.mjs','README.md' -Pattern 'Medi-Caps|Cause.*26|MCU2[0-9]|medicaps' -CaseSensitive | ForEach-Object { "$($_.Path):$($_.LineNumber)  $($_.Line.Trim())" }
Write-Host '(end of scan)'
