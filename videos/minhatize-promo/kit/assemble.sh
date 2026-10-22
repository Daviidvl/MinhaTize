#!/usr/bin/env bash
# Rebuild frames from kit/, then re-run the workflow's assembly + transition injection.
set -e
cd "$(dirname "$0")/.."
S="C:/Users/david/.claude/plugins/cache/hyperframes/hyperframes/0.8.143/skills"
node kit/build.mjs "$@"
node "$S/product-launch-video/scripts/assemble-index.mjs" --storyboard ./STORYBOARD.md --hyperframes . | grep -E "wrote|total"
node "$S/product-launch-video/scripts/transitions.mjs" inject --storyboard ./STORYBOARD.md --hyperframes . | tail -1
node "$S/product-launch-video/scripts/transitions.mjs" verify --storyboard ./STORYBOARD.md --index ./index.html | head -1
