#!/bin/bash
# Auto-commit script for chronograph-app
# Watches for changes and commits automatically

cd "$(dirname "$0")/.." || exit 1

echo "🔄 Auto-commit watcher started for chronograph-app"
echo "   Press Ctrl+C to stop"
echo ""

# Function to commit changes
commit_changes() {
    local changes=$(git status --porcelain)
    if [ -n "$changes" ]; then
        # Get list of changed files for commit message
        local files=$(git status --porcelain | awk '{print $2}' | head -5 | tr '\n' ', ' | sed 's/,$//')
        local count=$(git status --porcelain | wc -l)

        if [ "$count" -gt 5 ]; then
            files="$files and $((count - 5)) more"
        fi

        git add -A
        git commit -m "$(cat <<EOF
Auto-commit: Update $files

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
EOF
)"
        git push origin main
        echo "✅ $(date '+%H:%M:%S') Committed and pushed: $files"
    fi
}

# Check if inotifywait is available
if command -v inotifywait &> /dev/null; then
    echo "Using inotifywait for file watching..."
    while true; do
        inotifywait -r -e modify,create,delete --exclude '(node_modules|\.git|dist)' src/ server/src/ 2>/dev/null
        sleep 2  # Debounce
        commit_changes
    done
else
    echo "Using polling mode (every 30 seconds)..."
    while true; do
        commit_changes
        sleep 30
    done
fi
