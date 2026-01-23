$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
Set-Location $PSScriptRoot
$env:Path = "C:\Program Files\nodejs;" + $env:Path
npm run dev

