param([Parameter(Mandatory=$true)][string]$Destination)
$ErrorActionPreference = 'Stop'
if (Test-Path -LiteralPath $Destination) { throw 'Destination already exists; choose a new folder to preserve its files.' }
# Every required input is checked before creating the destination.
$items = @('_quarto.yml','_quarto-single.yml','course.yml','course.qmd','layouts.qmd','theme','assets','build.ps1','serve.py','README.md','AGENTS.md','LICENSE','THIRD_PARTY_NOTICES.md','BASELINE.json','素材来源.md','新建课程.cmd','New-Course.ps1','生成课件.cmd','打开课件.cmd','查看版式.cmd','打开模板说明.cmd')
foreach ($item in $items) {
  if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot $item))) { throw "Missing template input: $item" }
}
New-Item -ItemType Directory -Path $Destination | Out-Null
foreach ($item in $items) {
  Copy-Item -LiteralPath (Join-Path $PSScriptRoot $item) -Destination $Destination -Recurse
}
Write-Host "Created: $Destination"
Write-Host 'Edit course.yml and course.qmd, then run build.ps1.'
