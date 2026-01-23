$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition
$VenvPath = Join-Path $PSScriptRoot "venv\Scripts\Activate.ps1"

if (Test-Path $VenvPath) {
    Set-Location $PSScriptRoot
    . $VenvPath
    python -m uvicorn main:app --reload --port 8000
} else {
    Write-Host "Error: Virtual environment not found. Please run the setup first." -ForegroundColor Red
}
