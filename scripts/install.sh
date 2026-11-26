#!/usr/bin/env bash
# =====================================================================
# install.sh: install the BeforeMerge skills into your agent tools.
#
# Usage: bash scripts/install.sh [targets] [options]
#
# Targets (default: every tool detected on this machine):
#   --claude     Claude Code            ~/.claude/skills/
#   --agents     shared ~/.agents/skills/ (OpenAI Codex CLI, OpenCode)
#   --all        both of the above, detected or not
#
# Options:
#   --skill NAME install only this skill (repeatable; folder name, e.g. nextjs-review)
#   --link       symlink each skill to this checkout instead of copying,
#                so a `git pull` updates every tool at once
#   --force      replace a skill folder that this script did not install
#                (the old folder is moved to ~/.beforemerge-backups/<time>/)
#   --dry-run    print what would happen and change nothing
#   --uninstall  remove the skills this script installed; anything else is kept
#   -h, --help   show this help
#
# Each skill lands in a folder named after its SKILL.md `name`
# (beforemerge-nextjs-review, ...). Re-running is safe: up-to-date skills
# are skipped. Needs only bash and coreutils; never uses sudo.
# Exit code 3 means at least one skill was skipped because a folder this
# script did not install was in the way.
#
# The multi-tool approach is adapted from scripts/install.sh in
# elementalsouls/Claude-BugHunter (MIT, Copyright (c) 2026 Sachin Sharma).
# =====================================================================
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SKILLS_SRC="$REPO_DIR/skills"
MARKER=".beforemerge-install"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_ROOT="$HOME/.beforemerge-backups/$STAMP"

usage() { sed -n '3,/^# =====/p' "$0" | sed -e '$d' -e 's/^# \{0,1\}//'; }

DO_CLAUDE=0; DO_AGENTS=0; ANY_TARGET=0
LINK=0; FORCE=0; DRY=0; UNINSTALL=0
ONLY=""

while [ $# -gt 0 ]; do
  case "$1" in
    --claude) DO_CLAUDE=1; ANY_TARGET=1 ;;
    --agents) DO_AGENTS=1; ANY_TARGET=1 ;;
    --all) DO_CLAUDE=1; DO_AGENTS=1; ANY_TARGET=1 ;;
    --skill)
      [ $# -ge 2 ] || { echo "--skill needs a name" >&2; exit 2; }
      ONLY="$ONLY $2"; shift ;;
    --link) LINK=1 ;;
    --force) FORCE=1 ;;
    --dry-run) DRY=1 ;;
    --uninstall) UNINSTALL=1 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1 (try --help)" >&2; exit 2 ;;
  esac
  shift
done

if [ "$ANY_TARGET" = 0 ]; then
  if [ -d "$HOME/.claude" ] || command -v claude >/dev/null 2>&1; then DO_CLAUDE=1; fi
  if [ -d "$HOME/.agents" ] || command -v codex >/dev/null 2>&1 || command -v opencode >/dev/null 2>&1; then DO_AGENTS=1; fi
  if [ "$DO_CLAUDE" = 0 ] && [ "$DO_AGENTS" = 0 ]; then
    echo "No supported agent tool detected. Pick one explicitly: --claude, --agents or --all." >&2
    exit 1
  fi
fi

run() {
  if [ "$DRY" = 1 ]; then echo "    would run: $*"; else "$@"; fi
}

skill_name() {
  # The `name` field of a SKILL.md, without quotes.
  sed -n 's/^name:[[:space:]]*//p' "$1" | head -n 1 | tr -d "\"'" | tr -d '[:space:]'
}

# Is the existing folder at $1 one this script installed from $2?
is_ours() {
  local dest="$1" src="$2"
  if [ -L "$dest" ]; then
    [ "$(cd "$dest" 2>/dev/null && pwd -P)" = "$(cd "$src" && pwd -P)" ]
    return
  fi
  [ -d "$dest" ] && [ -f "$dest/$MARKER" ]
}

# Is the existing install at $1 already identical to the source $2?
is_current() {
  local dest="$1" src="$2"
  if [ "$LINK" = 1 ]; then
    [ -L "$dest" ]
  else
    [ ! -L "$dest" ] && diff -rq -x "$MARKER" "$src" "$dest" >/dev/null 2>&1
  fi
}

place() {
  local src="$1" dest="$2"
  if [ "$LINK" = 1 ]; then
    run ln -s "$src" "$dest"
  else
    run cp -R "$src" "$dest"
    if [ "$DRY" = 1 ]; then
      echo "    would write: $dest/$MARKER"
    else
      printf 'Installed by BeforeMerge scripts/install.sh from %s\n' "$REPO_DIR" > "$dest/$MARKER"
    fi
  fi
}

installed=0; skipped=0; refused=0; removed=0

install_into() {
  local label="$1" root="$2"
  echo "$label -> $root"
  if [ "$UNINSTALL" = 0 ] && [ ! -d "$root" ]; then run mkdir -p "$root"; fi

  local src dir name dest
  for src in "$SKILLS_SRC"/*/; do
    src="${src%/}"
    dir="$(basename "$src")"
    [ -f "$src/SKILL.md" ] || continue
    if [ -n "$ONLY" ]; then
      case " $ONLY " in *" $dir "*) ;; *) continue ;; esac
    fi
    name="$(skill_name "$src/SKILL.md")"
    if [ -z "$name" ]; then echo "  ! $dir: SKILL.md has no name, skipped" >&2; continue; fi
    dest="$root/$name"

    if [ "$UNINSTALL" = 1 ]; then
      if [ -e "$dest" ] || [ -L "$dest" ]; then
        if is_ours "$dest" "$src"; then
          echo "  - remove $name"
          run rm -rf "$dest"
          removed=$((removed + 1))
        else
          echo "  ! keep $name (not installed by this script)"
          refused=$((refused + 1))
        fi
      fi
      continue
    fi

    if [ -e "$dest" ] || [ -L "$dest" ]; then
      if is_ours "$dest" "$src"; then
        if is_current "$dest" "$src"; then
          echo "  = $name is up to date"
          skipped=$((skipped + 1))
          continue
        fi
        echo "  ~ update $name"
        run rm -rf "$dest"
      elif [ "$FORCE" = 1 ]; then
        echo "  ! replace $name (backup in $BACKUP_ROOT/$label/)"
        run mkdir -p "$BACKUP_ROOT/$label"
        run mv "$dest" "$BACKUP_ROOT/$label/$name"
      else
        echo "  ! skip $name: $dest exists and was not installed by this script (use --force to replace it)"
        refused=$((refused + 1))
        continue
      fi
    else
      echo "  + install $name"
    fi
    place "$src" "$dest"
    installed=$((installed + 1))
  done
}

[ "$DRY" = 1 ] && echo "Dry run: nothing will be changed."
[ "$DO_CLAUDE" = 1 ] && install_into claude "$HOME/.claude/skills"
[ "$DO_AGENTS" = 1 ] && install_into agents "$HOME/.agents/skills"

if [ "$UNINSTALL" = 1 ]; then
  echo "Done: $removed removed, $refused kept."
else
  echo "Done: $installed installed or updated, $skipped up to date, $refused skipped."
fi
[ "$refused" = 0 ] || [ "$UNINSTALL" = 1 ] || exit 3
