#!/bin/sh

COMMIT_MSG_FILE=$1
COMMIT_SOURCE=$2
BRANCH_NAME=$(git symbolic-ref --short HEAD 2>/dev/null || true)
DEFAULT_PREFIX="AF-0000"

# Skip on merge or squash commits
if [ "$COMMIT_SOURCE" = "merge" ] || [ "$COMMIT_SOURCE" = "squash" ]; then
  exit 0
fi

# Extract ticket and convert to uppercase
RAW_PREFIX=$(printf "%s" "$BRANCH_NAME" | grep -oiE '[A-Za-z]+-[0-9]+' | head -n1 | tr '[:lower:]' '[:upper:]')
if [ -z "$RAW_PREFIX" ]; then
  RAW_PREFIX=$DEFAULT_PREFIX
fi
DISPLAY_PREFIX="${RAW_PREFIX}:"

# First line of the commit message
firstline=$(sed -n '1p' "$COMMIT_MSG_FILE" || true)

# If it already starts with the correct "PREFIX:", nothing to do
case "$firstline" in
  "$DISPLAY_PREFIX"* )
    exit 0
    ;;
esac

# If it starts with "PREFIX " (without colon), replace with "PREFIX: rest"
if printf '%s' "$firstline" | grep -qE "^${RAW_PREFIX} "; then
  # Extract the rest after the space
  rest=$(printf '%s' "$firstline" | sed -E "s/^${RAW_PREFIX} (.*)/\1/")
  new_firstline="${DISPLAY_PREFIX} ${rest}"
  # Write new first line and the rest of the file
  {
    printf '%s\n' "$new_firstline"
    tail -n +2 "$COMMIT_MSG_FILE"
  } > "${COMMIT_MSG_FILE}.tmp" && mv "${COMMIT_MSG_FILE}.tmp" "$COMMIT_MSG_FILE"
  exit 0
fi

# Otherwise: prefix normally ("PREFIX: original-firstline")
tmpfile=$(mktemp) || exit 1
printf '%s %s\n' "$DISPLAY_PREFIX" "$firstline" > "$tmpfile"
tail -n +2 "$COMMIT_MSG_FILE" >> "$tmpfile"
cat "$tmpfile" > "$COMMIT_MSG_FILE"
rm "$tmpfile"
