$src = 'c:\Users\jainj\OneDrive\Desktop\Hostel Hub\src\i18n'
Get-ChildItem -Path $src -Filter '*.ts' -File | ForEach-Object {
  $file = $_.FullName
  $lines = [System.IO.File]::ReadAllLines($file)
  foreach ($i in 0..($lines.Length-1)) {
    if ($lines[$i] -match "'footer\.[a-zA-Z]+'") {
      Write-Host "$([$_.Name]):L$($i+1)  $($lines[$i].Trim())"
    }
  }
}

Write-Host "`n=== app.institute across dicts ==="
Get-ChildItem -Path $src -Filter '*.ts' -File | ForEach-Object {
  $file = $_.FullName
  $lines = [System.IO.File]::ReadAllLines($file)
  foreach ($i in 0..($lines.Length-1)) {
    if ($lines[$i] -match "'app\.institute'") {
      Write-Host "$([$_.Name]):L$($i+1)  $($lines[$i].Trim())"
    }
  }
}

Write-Host "`n=== footer.* usage in TSX ==="
Get-ChildItem -Path 'c:\Users\jainj\OneDrive\Desktop\Hostel Hub\src' -Recurse -Include '*.tsx' -File |
  Select-String -Pattern "'footer\.[a-zA-Z]+'" |
  ForEach-Object { "$($_.Path.Replace('c:\Users\jainj\OneDrive\Desktop\Hostel Hub\',''))=>L$($_.LineNumber) $($_.Line.Trim())" }
