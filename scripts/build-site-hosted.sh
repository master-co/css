#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Pages and Vercel build images do not guarantee a Rust installation.
# rustup reads the pinned toolchain, components and Wasm target from the repo.
export PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$PATH"
if ! command -v rustup >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 --fail --silent --show-error https://sh.rustup.rs \
    | sh -s -- -y --no-modify-path --default-toolchain none
fi
rustup show active-toolchain

pnpm build:site
