param([string]$root = $PSScriptRoot)
$candidates = @(
    (Join-Path $root 'src/components/landing/nav.tsx'),
    (Join-Path $root 'src/components/landing/hero.tsx'),
    (Join-Path $root 'src/components/landing/cta.tsx'),
    (Join-Path $root 'src/i18n/en3.ts'),
    (Join-Path $root 'src/i18n/hi3.ts'),
    (Join-Path $root 'src/i18n/hinglish3.ts'),
    (Join-Path $root 'src/components/footer.tsx'),
    (Join-Path $root 'src/app/layout.tsx'),
    (Join-Path $root 'src/app/page.tsx'),
    (Join-Path $root 'src/lib/auth.ts'),
    (Join-Path $root 'README.md'),
    (Join-Path $root 'src/types/index.ts')
)
$pattern = 'Medi-Caps|Cause.{1,3}26|medicap|MCU[0-9]+|Indro|[Mm]onaster|[Mm]edi|[Cc]ause'
Write-Host '=== Files with brand references ==='
$candidates | Where-Object { Test-Path $_ } | ForEach-Object {
    $txt = Get-Content $_ -Raw
    if ($txt -match $pattern) {
        Write-Host $_.Name
        Get-Content $_ | Select-String -Pattern $pattern | ForEach-Object { Write-Host "  L$_.LineNumber: $($_.Line.Trim())" }
    }
}
Write-Host '=== Done ==='