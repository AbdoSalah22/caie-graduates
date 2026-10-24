param(
    [string]$Branch = "",
    [string]$Remote = "origin",
    [switch]$SkipInstall,
    [switch]$AllowDirty
)

$ErrorActionPreference = "Stop"

function Invoke-CheckedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Message,

        [Parameter(Mandatory = $true)]
        [scriptblock]$Script
    )

    Write-Host ""
    Write-Host "==> $Message"
    & $Script

    if ($LASTEXITCODE -ne 0) {
        throw "Command failed while: $Message"
    }
}

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

if (-not (Test-Path "$repoRoot\.env.local")) {
    throw "Missing .env.local. Add NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_API_KEY before running this script."
}

$workingTree = git status --porcelain
if ($workingTree -and -not $AllowDirty) {
    throw "Working tree is not clean. Commit or stash your changes before running this script, or pass -AllowDirty."
}

if ($workingTree -and $AllowDirty) {
    Write-Host "Dirty worktree detected; preserving current changes before updating preview data."
    git add -A
    git diff --cached --quiet
    if ($LASTEXITCODE -ne 0) {
        git commit -m "chore: save preview export snapshot"
    }
}

if (-not $Branch) {
    $Branch = git branch --show-current
}

if (-not $Branch) {
    throw "Could not determine the current branch. Pass -Branch explicitly."
}

Invoke-CheckedCommand -Message "Fetching latest remote changes" -Script {
    git fetch --all --prune
}

Invoke-CheckedCommand -Message "Updating $Branch from $Remote/$Branch" -Script {
    git checkout $Branch
    git pull --ff-only "$Remote" "$Branch"
}

if (-not $SkipInstall) {
    Invoke-CheckedCommand -Message "Installing npm dependencies" -Script {
        npm install
    }
}

Invoke-CheckedCommand -Message "Exporting preview data from Firestore" -Script {
    npm run export-preview
}

Invoke-CheckedCommand -Message "Building static site for GitHub Pages" -Script {
    npm run build
}

if (-not (Test-Path "$repoRoot\out")) {
    throw "Build output folder 'out' was not created. Check the build logs."
}

$gitChanges = git status --porcelain
if ($gitChanges) {
    Write-Host "Changes detected after export/build. Staging them for commit."
    Invoke-CheckedCommand -Message "Staging export and build output" -Script {
        git add public/preview-data out
    }

    $commitMessage = "chore: refresh preview export and static pages"
    Invoke-CheckedCommand -Message "Creating commit: $commitMessage" -Script {
        git commit -m $commitMessage
    }

    Invoke-CheckedCommand -Message "Pushing to $Remote/$Branch" -Script {
        git push "$Remote" "$Branch"
    }
}
else {
    Write-Host "No file changes were produced after export/build; nothing to commit or push."
}

Write-Host ""
Write-Host "Preview data update finished. GitHub Pages will rebuild automatically from the pushed commit."
