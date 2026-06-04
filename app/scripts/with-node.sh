#!/usr/bin/env bash
# Run a command under the Node version pinned in .nvmrc, via nvm.
# The host's default Node may be too old (Vite/Remotion need >=18); this
# transparently switches before running dev/build/test/etc. If nvm isn't
# installed, it falls back to whatever `node` is already on PATH.
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck disable=SC1091
  . "$NVM_DIR/nvm.sh"
  nvm use >/dev/null 2>&1 || nvm install >/dev/null 2>&1
fi
exec "$@"
