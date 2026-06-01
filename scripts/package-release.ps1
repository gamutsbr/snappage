Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Assert-Condition {
  param(
    [object]$Condition,
    [string]$Message
  )

  if (-not $Condition) {
    throw $Message
  }
}

function Get-NormalizedZipEntries {
  param(
    [System.IO.Compression.ZipArchive]$Archive
  )

  return @($Archive.Entries | ForEach-Object { $_.FullName -replace '\\', '/' })
}

function Get-ZipEntry {
  param(
    [System.IO.Compression.ZipArchive]$Archive,
    [string]$EntryName
  )

  return $Archive.Entries | Where-Object { ($_.FullName -replace '\\', '/') -eq $EntryName } | Select-Object -First 1
}

$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
  throw 'Unable to determine script directory.'
}

$repoRoot = (Resolve-Path (Join-Path $scriptRoot '..')).Path
$srcRoot = Join-Path $repoRoot 'src'
$iconsRoot = Join-Path $srcRoot 'icons'
$readmePath = Join-Path $repoRoot 'LEIA-ME.txt'
$manifestPath = Join-Path $srcRoot 'manifest.json'
$releasesRoot = Join-Path $repoRoot 'releases'

Add-Type -AssemblyName System.IO.Compression.FileSystem

$requiredFiles = @(
  $readmePath,
  $manifestPath,
  (Join-Path $srcRoot 'background.js'),
  (Join-Path $srcRoot 'popup.html'),
  (Join-Path $srcRoot 'popup.css'),
  (Join-Path $srcRoot 'popup.js'),
  (Join-Path $iconsRoot 'icon16.png'),
  (Join-Path $iconsRoot 'icon48.png'),
  (Join-Path $iconsRoot 'icon128.png')
)

foreach ($filePath in $requiredFiles) {
  if (-not (Test-Path -LiteralPath $filePath)) {
    throw "Required file missing: $filePath"
  }
}

$manifestRaw = Get-Content -LiteralPath $manifestPath -Raw
try {
  $manifest = $manifestRaw | ConvertFrom-Json -ErrorAction Stop
}
catch {
  throw "Invalid JSON in manifest: $manifestPath. $($_.Exception.Message)"
}

Assert-Condition ($manifest.PSObject.Properties.Name -contains 'version') 'Manifest version is missing.'
Assert-Condition ($manifest.version) 'Manifest version is empty.'
Assert-Condition ($manifest.PSObject.Properties.Name -contains 'icons') 'Manifest top-level icons are missing.'
Assert-Condition ($manifest.PSObject.Properties.Name -contains 'action') 'Manifest action section is missing.'
Assert-Condition ($manifest.action.PSObject.Properties.Name -contains 'default_icon') 'Manifest action.default_icon is missing.'

$version = [string]$manifest.version
$packageName = "snappage-v$version"
$zipName = "$packageName.zip"
$zipPath = Join-Path $releasesRoot $zipName

$readmeRaw = Get-Content -LiteralPath $readmePath -Raw
Assert-Condition ($readmeRaw -match [regex]::Escape("v$version")) "LEIA-ME.txt does not mention version v$version."

if (-not (Test-Path -LiteralPath $releasesRoot)) {
  New-Item -ItemType Directory -Path $releasesRoot | Out-Null
}

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("snappage-package-" + [Guid]::NewGuid().ToString('N'))
$stagingRoot = Join-Path $tempRoot $packageName

try {
  New-Item -ItemType Directory -Path $stagingRoot -Force | Out-Null

  Copy-Item -LiteralPath $readmePath -Destination (Join-Path $stagingRoot 'LEIA-ME.txt') -Force
  Copy-Item -LiteralPath $srcRoot -Destination (Join-Path $stagingRoot 'src') -Recurse -Force

  Compress-Archive -Path $stagingRoot -DestinationPath $zipPath -Force

  if (-not (Test-Path -LiteralPath $zipPath)) {
    throw "ZIP creation failed: $zipPath"
  }

  $zipFile = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
  try {
    $entries = Get-NormalizedZipEntries -Archive $zipFile
    $requiredEntries = @(
      "$packageName/LEIA-ME.txt",
      "$packageName/src/manifest.json",
      "$packageName/src/background.js",
      "$packageName/src/popup.html",
      "$packageName/src/popup.css",
      "$packageName/src/popup.js",
      "$packageName/src/icons/icon16.png",
      "$packageName/src/icons/icon48.png",
      "$packageName/src/icons/icon128.png"
    )

    foreach ($entryName in $requiredEntries) {
      Assert-Condition ($entries -contains $entryName) "Missing required ZIP entry: $entryName"
    }

    foreach ($entryName in $entries) {
      Assert-Condition ($entryName -like "$packageName/*") "Unexpected ZIP entry outside package root: $entryName"
    }

    $readmeEntry = Get-ZipEntry -Archive $zipFile -EntryName "$packageName/LEIA-ME.txt"
    Assert-Condition ($null -ne $readmeEntry) 'LEIA-ME.txt is missing from the ZIP.'

    $readmeEntryStream = $readmeEntry.Open()
    try {
      $zipReadme = [System.IO.StreamReader]::new($readmeEntryStream).ReadToEnd()
    }
    finally {
      $readmeEntryStream.Dispose()
    }
    Assert-Condition ($zipReadme -match [regex]::Escape("v$version")) "ZIP LEIA-ME.txt does not mention version v$version."

    $manifestEntry = Get-ZipEntry -Archive $zipFile -EntryName "$packageName/src/manifest.json"
    Assert-Condition ($null -ne $manifestEntry) 'manifest.json is missing from the ZIP.'

    $manifestEntryStream = $manifestEntry.Open()
    try {
      $zipManifestRaw = [System.IO.StreamReader]::new($manifestEntryStream).ReadToEnd()
    }
    finally {
      $manifestEntryStream.Dispose()
    }

    try {
      $zipManifest = $zipManifestRaw | ConvertFrom-Json -ErrorAction Stop
    }
    catch {
      throw "Invalid JSON in ZIP manifest: $($_.Exception.Message)"
    }

    Assert-Condition ($zipManifest.version -eq $version) "ZIP manifest version mismatch. Expected $version, found $($zipManifest.version)."
    Assert-Condition ($zipManifest.PSObject.Properties.Name -contains 'icons') 'ZIP manifest is missing top-level icons.'
    Assert-Condition ($zipManifest.PSObject.Properties.Name -contains 'action') 'ZIP manifest action section is missing.'
    Assert-Condition ($zipManifest.action.PSObject.Properties.Name -contains 'default_icon') 'ZIP manifest action.default_icon is missing.'
  }
  finally {
    $zipFile.Dispose()
  }

  $sha256 = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash
  Write-Output "ZIP: $zipPath"
  Write-Output "SHA256: $sha256"
}
finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force -ErrorAction SilentlyContinue
  }
}
