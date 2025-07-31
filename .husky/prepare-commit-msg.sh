#!/bin/sh

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2
BRANCH_NAME=$(git symbolic-ref --short HEAD 2>/dev/null || true)
DEFAULT_PREFIX="AF-0000"

# Skip bei merge oder squash commits
if [ "$COMMIT_SOURCE" = "merge" ] || [ "$COMMIT_SOURCE" = "squash" ]; then
  exit 0
fi

# Ticket extrahieren und uppercase
RAW_PREFIX=$(printf "%s" "$BRANCH_NAME" | grep -oiE '[A-Za-z]+-[0-9]+' | head -n1 | tr '[:lower:]' '[:upper:]')
if [ -z "$RAW_PREFIX" ]; then
  RAW_PREFIX=$DEFAULT_PREFIX
fi
DISPLAY_PREFIX="${RAW_PREFIX}:"

# Erste Zeile der Commit-Message
firstline=$(sed -n '1p' "$COMMIT_MSG_FILE" || true)

# Wenn schon mit korrektem "PREFIX:" beginnt, nothing to do
case "$firstline" in
  "$DISPLAY_PREFIX"* )
    exit 0
    ;;
esac

# Wenn mit "PREFIX " (ohne colon) beginnt, ersetzen auf "PREFIX: rest"
if printf '%s' "$firstline" | grep -qE "^${RAW_PREFIX} "; then
  # Extrahiere den Rest nach dem space
  rest=$(printf '%s' "$firstline" | sed -E "s/^${RAW_PREFIX} (.*)/\1/")
  new_firstline="${DISPLAY_PREFIX} ${rest}"
  # Schreibe neue erste Zeile und den Rest der Datei
  {
    printf '%s\n' "$new_firstline"
    tail -n +2 "$COMMIT_MSG_FILE"
  } > "${COMMIT_MSG_FILE}.tmp" && mv "${COMMIT_MSG_FILE}.tmp" "$COMMIT_MSG_FILE"
  exit 0
fi

# Sonst: ganz normal prefixen ("PREFIX: original-firstline")
tmpfile=$(mktemp) || exit 1
printf '%s %s\n' "$DISPLAY_PREFIX" "$firstline" > "$tmpfile"
tail -n +2 "$COMMIT_MSG_FILE" >> "$tmpfile"
cat "$tmpfile" > "$COMMIT_MSG_FILE"
rm "$tmpfile"
