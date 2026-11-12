#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

release_evidence_dir=$(mktemp -d "${TMPDIR:-/tmp}/master-css-pages-release.XXXXXX")
trap 'rm -rf "$release_evidence_dir"' EXIT

# Fail before installing/building if this Git commit has no completed release.
# Only this helper's fixed, validated public metadata is exported; never eval it.
node scripts/pages-site-release.mjs hosted-prepare "$release_evidence_dir"
while IFS='=' read -r release_env_name release_env_value; do
  case "$release_env_name" in
    PUBLIC_COMMIT_REF|PUBLIC_VERSION|PUBLIC_URL|MASTER_CSS_IMAGE_TRANSFORMATIONS|MASTER_LEGACY_DESIGN_CUTOVER)
      export "$release_env_name=$release_env_value" ;;
    *) echo "Unexpected hosted release environment field" >&2; exit 1 ;;
  esac
done < "$release_evidence_dir/environment"
bun install --frozen-lockfile

# Pages build images do not guarantee a Rust installation.
# rustup reads the pinned toolchain, components and Wasm target from the repo.
export PATH="${CARGO_HOME:-$HOME/.cargo}/bin:$PATH"
if ! command -v rustup >/dev/null 2>&1; then
  curl --proto '=https' --tlsv1.2 --fail --silent --show-error https://sh.rustup.rs \
    | sh -s -- -y --no-modify-path --default-toolchain none
fi
rustup toolchain install --no-self-update
rustup show active-toolchain

bun run build:site
node scripts/pages-site-release.mjs hosted-verify "$release_evidence_dir"
