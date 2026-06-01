param(
  [switch]$RequireCleanGit
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Add-ValidationError {
  param([string]$Message)
  $script:Errors.Add($Message) | Out-Null
}

function Add-ValidationWarning {
  param([string]$Message)
  $script:Warnings.Add($Message) | Out-Null
}

function Test-RequiredFile {
  param([string]$Path)
  if (-not (Test-Path -LiteralPath $Path)) {
    Add-ValidationError "Missing required file: $Path"
    return $false
  }
  return $true
}

$Warnings = [System.Collections.Generic.List[string]]::new()
$Errors = [System.Collections.Generic.List[string]]::new()

$scriptRoot = $PSScriptRoot
if (-not $scriptRoot) {
  throw 'Unable to determine script directory.'
}

$repoRoot = (Resolve-Path (Join-Path $scriptRoot '..')).Path

$requiredRelativeFiles = @(
  'src/manifest.json',
  'src/background.js',
  'src/popup.html',
  'src/popup.css',
  'src/popup.js',
  'src/icons/icon16.png',
  'src/icons/icon48.png',
  'src/icons/icon128.png',
  'README.md',
  'CHANGELOG.md',
  'LEIA-ME.txt',
  'CLAUDE.md',
  'docs/RELEASE_CHECKLIST.md',
  'scripts/package-release.ps1'
)

$existingFiles = @{}
foreach ($relPath in $requiredRelativeFiles) {
  $fullPath = Join-Path $repoRoot $relPath
  $exists = Test-RequiredFile -Path $fullPath
  $existingFiles[$relPath] = $exists
}

$manifestPath = Join-Path $repoRoot 'src/manifest.json'
$manifest = $null
$version = $null

if ($existingFiles['src/manifest.json']) {
  $manifestRaw = Get-Content -LiteralPath $manifestPath -Raw
  try {
    $manifest = $manifestRaw | ConvertFrom-Json -ErrorAction Stop
  }
  catch {
    Add-ValidationError "Invalid JSON in src/manifest.json: $($_.Exception.Message)"
  }
}

if ($null -ne $manifest) {
  if (-not ($manifest.PSObject.Properties.Name -contains 'manifest_version')) {
    Add-ValidationError 'Manifest missing manifest_version.'
  }
  if (-not ($manifest.PSObject.Properties.Name -contains 'name')) {
    Add-ValidationError 'Manifest missing name.'
  }
  if (-not ($manifest.PSObject.Properties.Name -contains 'version')) {
    Add-ValidationError 'Manifest missing version.'
  }
  if (-not ($manifest.PSObject.Properties.Name -contains 'description')) {
    Add-ValidationError 'Manifest missing description.'
  }
  if (-not ($manifest.PSObject.Properties.Name -contains 'icons')) {
    Add-ValidationError 'Manifest missing top-level icons.'
  }
  if (-not ($manifest.PSObject.Properties.Name -contains 'action') -or -not ($manifest.action.PSObject.Properties.Name -contains 'default_icon')) {
    Add-ValidationError 'Manifest missing action.default_icon.'
  }

  $version = [string]$manifest.version
  if (-not $version) {
    Add-ValidationError 'Manifest version is empty.'
  }
  elseif ($version -notmatch '^\d+\.\d+\.\d+$') {
    Add-ValidationError "Manifest version is not SemVer X.Y.Z: $version"
  }
}

if ($version) {
  if ($existingFiles['LEIA-ME.txt']) {
    $leiaRaw = Get-Content -LiteralPath (Join-Path $repoRoot 'LEIA-ME.txt') -Raw
    if ($leiaRaw -notmatch [regex]::Escape("v$version")) {
      Add-ValidationError "LEIA-ME.txt does not mention v$version."
    }
  }

  if ($existingFiles['CHANGELOG.md']) {
    $changelogRaw = Get-Content -LiteralPath (Join-Path $repoRoot 'CHANGELOG.md') -Raw
    if ($changelogRaw -notmatch [regex]::Escape("## [$version]")) {
      Add-ValidationError "CHANGELOG.md does not contain ## [$version]."
    }
  }
}

if ($existingFiles['docs/RELEASE_CHECKLIST.md']) {
  $checklistRaw = Get-Content -LiteralPath (Join-Path $repoRoot 'docs/RELEASE_CHECKLIST.md') -Raw
  if ($checklistRaw -notmatch [regex]::Escape('scripts/package-release.ps1')) {
    Add-ValidationError 'docs/RELEASE_CHECKLIST.md does not mention scripts/package-release.ps1.'
  }
}

if ($existingFiles['CLAUDE.md']) {
  $claudeRaw = Get-Content -LiteralPath (Join-Path $repoRoot 'CLAUDE.md') -Raw
  if ($claudeRaw -notmatch [regex]::Escape('scripts/package-release.ps1')) {
    Add-ValidationError 'CLAUDE.md does not mention scripts/package-release.ps1.'
  }
}

if ($existingFiles['src/popup.html']) {
  $popupHtmlRaw = Get-Content -LiteralPath (Join-Path $repoRoot 'src/popup.html') -Raw
  if ($popupHtmlRaw -notmatch [regex]::Escape('data-app-version')) {
    Add-ValidationError 'src/popup.html is missing data-app-version.'
  }
}

if ($existingFiles['src/popup.js']) {
  $popupJsRaw = Get-Content -LiteralPath (Join-Path $repoRoot 'src/popup.js') -Raw
  if ($popupJsRaw -notmatch [regex]::Escape('chrome.runtime.getManifest')) {
    Add-ValidationError 'src/popup.js is missing chrome.runtime.getManifest usage.'
  }
}

$srcRoot = Join-Path $repoRoot 'src'
if (Test-Path -LiteralPath $srcRoot) {
  $hardcodedPattern = '(?<![A-Za-z0-9])v\d+\.\d+\b'
  $hardcodedHits = @()
  Get-ChildItem -LiteralPath $srcRoot -File -Recurse | Where-Object { $_.Name -ne 'manifest.json' } | ForEach-Object {
    $matches = Select-String -Path $_.FullName -Pattern $hardcodedPattern
    foreach ($m in $matches) {
      $fullMatchPath = (Resolve-Path -LiteralPath $m.Path).Path
      if ($fullMatchPath.StartsWith($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
        $relativePath = $fullMatchPath.Substring($repoRoot.Length).TrimStart([char[]]@('\', '/')).Replace('\\', '/')
      }
      else {
        $relativePath = $m.Path.Replace('\\', '/')
      }
      $hardcodedHits += ('{0}:{1}:{2}' -f $relativePath, $m.LineNumber, $m.Line.Trim())
    }
  }
  if ($hardcodedHits.Count -gt 0) {
    Add-ValidationError ('Hardcoded UI version candidates found under src/: ' + ($hardcodedHits -join ' | '))
  }
}

$gitignorePath = Join-Path $repoRoot '.gitignore'
if (-not (Test-Path -LiteralPath $gitignorePath)) {
  Add-ValidationError '.gitignore is missing.'
}
else {
  $gitignoreRaw = Get-Content -LiteralPath $gitignorePath -Raw
  if ($gitignoreRaw -notmatch '(?m)^releases/\*\.zip\s*$') {
    Add-ValidationError '.gitignore does not contain releases/*.zip ignore rule.'
  }
}

$gitSummary = 'git unavailable'
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if ($gitCmd) {
  try {
    $gitStatusShort = @(git -C $repoRoot status -sb)
    if ($gitStatusShort.Count -gt 0) {
      $gitSummary = $gitStatusShort[0]
    }
    else {
      $gitSummary = 'git status -sb produced no output'
    }

    $porcelain = @(git -C $repoRoot status --porcelain)
    if ($porcelain.Count -gt 0) {
      if ($RequireCleanGit) {
        Add-ValidationError 'Working tree is dirty and -RequireCleanGit was used.'
      }
      else {
        Add-ValidationWarning 'Working tree is dirty.'
      }
    }

    $staged = @(git -C $repoRoot diff --cached --name-only)
    foreach ($path in $staged) {
      $normalized = $path.Replace('\\', '/')
      if ($normalized -match '(?i)(^|/)CLAUDE_PRIVATE\.md$') {
        Add-ValidationError 'Staged file includes CLAUDE_PRIVATE.md.'
      }
      if ($normalized -match '(?i)^releases/') {
        Add-ValidationError "Staged file under releases/: $normalized"
      }
      if ($normalized -match '(?i)\.zip$') {
        Add-ValidationError "Staged ZIP file detected: $normalized"
      }
    }
  }
  catch {
    Add-ValidationWarning "Git checks failed: $($_.Exception.Message)"
  }
}
else {
  Add-ValidationWarning 'Git is not available in PATH; git safety checks skipped.'
}

if ($version) {
  Write-Output "Version detected: v$version"
}
else {
  Write-Output 'Version detected: (unavailable)'
}
Write-Output "Git status summary: $gitSummary"

if ($Warnings.Count -gt 0) {
  Write-Output 'Warnings:'
  foreach ($w in $Warnings) {
    Write-Output "- $w"
  }
}
else {
  Write-Output 'Warnings: none'
}

if ($Errors.Count -gt 0) {
  Write-Output 'Errors:'
  foreach ($e in $Errors) {
    Write-Output "- $e"
  }
  Write-Output "FAIL ($($Errors.Count) error(s), $($Warnings.Count) warning(s))"
  exit 1
}

Write-Output "PASS (0 errors, $($Warnings.Count) warning(s))"
exit 0
