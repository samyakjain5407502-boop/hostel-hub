$lines = Get-Content 'src/i18n/en6.ts'
Write-Host 'Total lines: ' + $lines.Count
Write-Host '--- Searching for chip / mock.waste / hero.note ---'
foreach ($i in 0..($lines.Count-1)) {
  $l = $lines[$i].Trim()
  if ($l -match 'chip|mock\.wa|hero\.note|landing\.badge') {
    Write-Host "$($i+1): $l"
  }
}
Write-Host '--- Lines 169-210 ---'
$lines[168..209] | ForEach-Object { Write-Host "$($_.ReadCount): $($_.Trim())" }
