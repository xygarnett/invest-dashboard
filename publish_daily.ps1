# 1) 重新生成 data.json（合并最新 fund_nav/trades/advice + 内嵌快照）
python build_data.py

# 2) 提交并推送（有变更才提交）
git add -A 2>$null
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
    Write-Host "[kanban-publish] no change, skip"
    exit 0
}
git commit -m "kanban daily publish" 2>$null
git push 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[kanban-publish] pushed OK"
} else {
    Write-Host "[kanban-publish] push FAILED"
    exit 1
}
