$ErrorActionPreference = 'SilentlyContinue'
git add -A
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "[kanban-publish] no change, skip"
    exit 0
}
git commit -m "kanban daily publish"
git push
Write-Host "[kanban-publish] pushed"
