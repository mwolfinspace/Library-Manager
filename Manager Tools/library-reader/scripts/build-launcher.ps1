param(
    [string]$ProjectRoot = (Resolve-Path "$PSScriptRoot\..").Path
)

$LauncherSrc = Join-Path $ProjectRoot "launcher"
$WinUnpacked = Join-Path $ProjectRoot "dist\win-unpacked"
$OutputDir = Join-Path $ProjectRoot "dist"

if (-not (Test-Path $WinUnpacked)) {
    Write-Error "win-unpacked not found at $WinUnpacked. Run `npm run dist` first."
    exit 1
}

# 1. Build Rust launcher
Write-Host "Building Rust launcher..."
Push-Location $LauncherSrc
cargo build --release
if ($LASTEXITCODE -ne 0) { throw "cargo build failed" }
Pop-Location

# 2. Inject shell32 "My Computer" icon into the packaged app
$iconSrc = Join-Path $ProjectRoot "build\icon.ico"
$iconDst = Join-Path $WinUnpacked "resources\app\build\icon.ico"
if (Test-Path $iconSrc) {
    $null = New-Item -ItemType Directory -Path (Split-Path $iconDst -Parent) -Force
    Copy-Item $iconSrc $iconDst -Force
    Write-Host "Icon injected: $iconDst"
}

# 3. ZIP the win-unpacked folder
Write-Host "Packing win-unpacked into ZIP..."
$zipPath = Join-Path $OutputDir "engine.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($WinUnpacked, $zipPath, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# 3. Append ZIP to launcher exe
Write-Host "Assembling final executable..."
$launcherExe = Join-Path $LauncherSrc "target\release\reader-launcher.exe"
$outputExe = Join-Path $OutputDir "Library Reader-1.0.0-x64.exe"
Copy-Item $launcherExe $outputExe -Force
$stream = [System.IO.File]::Open($outputExe, [System.IO.FileMode]::Append)
$zipBytes = [System.IO.File]::ReadAllBytes($zipPath)
$stream.Write($zipBytes, 0, $zipBytes.Length)
$stream.Close()

# 4. Cleanup
Remove-Item $zipPath -Force

Write-Host "Created: $outputExe"
