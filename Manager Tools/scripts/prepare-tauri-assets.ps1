$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root "tauri-dist"

if (Test-Path -LiteralPath $out) {
    Remove-Item -LiteralPath $out -Recurse -Force
}

New-Item -ItemType Directory -Path $out | Out-Null

$files = @(
    "Data_Manager.html",
    "Setting_Manager.html",
    "app.ico"
)

foreach ($file in $files) {
    $source = Join-Path $root $file
    if (Test-Path -LiteralPath $source) {
        Copy-Item -LiteralPath $source -Destination (Join-Path $out $file) -Force
    }
}

$dirs = @(
    "css",
    "js",
    "build",
    "default_gallery",
    "emoji_font",
    "icons",
    "library_template",
    "plugins",
    "themes",
    "vendor"
)

foreach ($dir in $dirs) {
    $source = Join-Path $root $dir
    if (Test-Path -LiteralPath $source) {
        Copy-Item -LiteralPath $source -Destination (Join-Path $out $dir) -Recurse -Force
    }
}

$backupScript = Join-Path $out "js/data_manager.js.backup"
if (Test-Path -LiteralPath $backupScript) {
    Remove-Item -LiteralPath $backupScript -Force
}

$htmlPath = Join-Path $out "Data_Manager.html"
$html = Get-Content -LiteralPath $htmlPath -Raw -Encoding UTF8
$bridgeTag = '    <script src="js/tauri_bridge.js"></script>' + [Environment]::NewLine + '    <script src="js/data_manager.js"></script>'
$html = $html -replace '    <script src="js/data_manager.js"></script>', $bridgeTag
Set-Content -LiteralPath $htmlPath -Value $html -Encoding UTF8

$rewriteFiles = @(
    "Data_Manager.html",
    "css/data_manager.css",
    "js/data_manager.js",
    "js/tauri_bridge.js"
)

foreach ($relativePath in $rewriteFiles) {
    $filePath = Join-Path $out $relativePath
    if (Test-Path -LiteralPath $filePath) {
        $content = Get-Content -LiteralPath $filePath -Raw -Encoding UTF8
        $content = $content -replace 'electronDataManager', 'xedrykDataManager'
        $content = $content -replace 'Electron', 'Desktop'
        $content = $content -replace 'electron', 'desktop'
        Set-Content -LiteralPath $filePath -Value $content -Encoding UTF8
    }
}
