# Start the Honest Label scan bridge on Windows.
# Usage (from the repo root):
#   powershell -ExecutionPolicy Bypass -File tools\scan-bridge\run.ps1
#   powershell -ExecutionPolicy Bypass -File tools\scan-bridge\run.ps1 --image C:\path\to\photo.jpg
# First run creates .venv and installs opencv-python and websockets.
# The key is loaded from credentials.env (gitignored) into this process only.
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$py = "python"
if (-not (Get-Command $py -ErrorAction SilentlyContinue)) { $py = "py" }
$vpy = Join-Path $PSScriptRoot ".venv\Scripts\python.exe"
if (-not (Test-Path $vpy)) {
    Write-Host "Creating .venv ..."
    & $py -m venv .venv
    & $vpy -m pip install -q --upgrade pip
    & $vpy -m pip install -q opencv-python websockets
}

$cred = Join-Path $PSScriptRoot "credentials.env"
if (Test-Path $cred) {
    Get-Content $cred | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
            $k, $v = $line.Split("=", 2)
            [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim().Trim('"').Trim("'"), "Process")
        }
    }
} else {
    Write-Host "No credentials.env found. Copy credentials.env.example to credentials.env and add GEMINI_API_KEY."
}

Write-Host "Running: $vpy bridge.py $args"
& $vpy bridge.py @args
