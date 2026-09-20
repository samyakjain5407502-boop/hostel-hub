$src = 'c:\Users\jainj\OneDrive\Desktop\Hostel Hub\src\i18n'
$keys = @(
  'footer.tagline2','footer.campus','footer.contactLine','footer.brandLine','footer.portals','footer.support','footer.rights',
  'app.institute','app.tagline','app.name',
  'landing.hero.titleA','landing.hero.titleHi','landing.hero.titleB','landing.hero.sub',
  'landing.hero.live','landing.hero.liveNow','landing.hero.chip1','landing.hero.chip2','landing.hero.chip3','landing.hero.chip4',
  'landing.hero.ctaDemo','landing.hero.ctaSecondary','landing.hero.note',
  'landing.mock.title','landing.mock.waste',
  'landing.portals.title','landing.portals.sub','landing.portals.p1d','landing.portals.p2d','landing.portals.p3d','landing.portals.p4d',
  'landing.portals.open','landing.portals.register','landing.portals.registerSub',
  'landing.badge','landing.trust.partners','landing.trust.title',
  'nav.adminColleges','nav.mgmtOperators','owner.title'
)
Get-ChildItem -Path $src -Filter '*.ts' -File | ForEach-Object {
  $fname = $_.Name
  $content = [System.IO.File]::ReadAllText($_.FullName)
  foreach ($k in $keys) {
    if ($content -match [regex]::Escape("'$k'")) {
      # find line number
      $lines = $content -split "`n"
      for ($i = 0; $i -lt $lines.Length; $i++) {
        if ($lines[$i] -match [regex]::Escape("'$k'")) {
          Write-Host "$fname :L$($i+1)  $($lines[$i].Trim())"
          break
        }
      }
    }
  }
}
