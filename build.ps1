param(
  [ValidateSet('all','course','layouts','single')][string]$Target = 'all'
)
$ErrorActionPreference = 'Stop'
if (-not (Get-Command quarto -ErrorAction SilentlyContinue)) {
  throw 'Quarto not found. Install Quarto or restart the terminal after installation.'
}
Push-Location $PSScriptRoot
try {
  switch ($Target) {
    'all' { & quarto render }
    'course' { & quarto render course.qmd }
    'layouts' { & quarto render layouts.qmd }
    'single' {
      # Quarto removes course_files when embedding course.qmd. Build in isolation
      # so the existing folder-based deck remains usable after a single export.
      $singleBuild = Join-Path $PSScriptRoot '.quarto/single-build'
      New-Item -ItemType Directory -Path $singleBuild -Force | Out-Null
      foreach ($item in @('_quarto.yml','_quarto-single.yml','course.yml','course.qmd','theme','assets')) {
        Copy-Item -LiteralPath (Join-Path $PSScriptRoot $item) -Destination $singleBuild -Recurse -Force
      }
      Push-Location $singleBuild
      try {
        & quarto render course.qmd --profile single --output course-single.html
        if ($LASTEXITCODE -ne 0) { throw 'Single-file render failed.' }
        Copy-Item -LiteralPath 'course-single.html' -Destination (Join-Path $PSScriptRoot 'course-single.html') -Force
      } finally { Pop-Location }
    }
  }
  if ($LASTEXITCODE -ne 0) { throw 'Quarto render failed. Read the error above.' }
} finally { Pop-Location }
