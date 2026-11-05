#!/usr/bin/env bash
set -euo pipefail
product=$1
evidence=$2
store=$3
receipt=$4
[[ "${GITHUB_REPOSITORY:-}" == master-co/css && "${GITHUB_REF:-}" == refs/heads/rc ]]
[[ "${GITHUB_EVENT_NAME:-}" == workflow_dispatch && "${GITHUB_RUN_ATTEMPT:-}" == 1 ]]
[[ "${EDITOR_EXECUTE:-}" == true && "${EDITOR_CONFIRM:-}" == 'PUBLISH C10 EDITORS 2.0.37 ONCE' ]]
[[ "$(git -C "$product" rev-parse HEAD)" == 6bf9adc4432b67e62613caea59d3b554711b4d54 ]]
targets=(win32-x64 win32-arm64 linux-x64 linux-arm64 alpine-x64 alpine-arm64 darwin-x64 darwin-arm64)
case "$store" in
  marketplace)
    publisher=masterco
    cli=(node "$product/node_modules/@vscode/vsce/vsce")
    [[ "$(node -p "require(process.argv[1]).version" "$product/node_modules/@vscode/vsce/package.json")" == 4.0.0 ]]
    timeout --kill-after=10s 120s "${cli[@]}" verify-pat --azure-credential masterco </dev/null >/dev/null 2>&1
    ;;
  open-vsx)
    publisher=master
    [[ -n "${OVSX_PAT:-}" ]]
    cli=("$RUNNER_TEMP/c10-ovsx/node_modules/.bin/ovsx" --registryUrl https://open-vsx.org)
    [[ "$(node -p "require(process.argv[1]).version" "$RUNNER_TEMP/c10-ovsx/node_modules/ovsx/package.json")" == 1.0.2 ]]
    timeout --kill-after=10s 120s "${cli[@]}" verify-pat master </dev/null >/dev/null 2>&1
    ;;
  *) exit 2 ;;
esac
record() {
  printf '{"store":"%s","publisher":"%s","target":"%s","version":"2.0.37","archiveSHA256":"%s","phase":"%s","exit":%s,"utc":"%s"}\n' \
    "$store" "$publisher" "$target" "$digest" "$1" "$2" "$(date -u +%FT%TZ)" | tee -a "$receipt"
}
for target in "${targets[@]}"; do
  archive="$evidence/candidate-vsix/$publisher/master-css-vscode-2.0.37-$target.vsix"
  [[ -f "$archive" && ! -L "$archive" ]]
  digest="$(sha256sum "$archive" | cut -d ' ' -f 1)"
  [[ "$digest" =~ ^[a-f0-9]{64}$ ]]
  args=(publish "$archive")
  if [[ "$store" == marketplace ]]; then
    args=(publish --azure-credential --packagePath "$archive")
  fi
  record submitted-intent null
  if timeout --kill-after=10s 300s "${cli[@]}" "${args[@]}" </dev/null >/dev/null 2>&1; then
    record command-accepted 0
  else
    status=$?
    record outcome-unresolved "$status"
    exit "$status"
  fi
done
