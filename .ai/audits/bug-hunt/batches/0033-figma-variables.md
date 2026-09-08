# 0033 Figma variable import/export contract

- Scope PKG-figma. HEAD unchanged; README/coverage Figma row read. package/AI, plugin.min.ts, import UI, get/setCollectionVariables.ts, variable-data.ts, color helpers and existing mock test.
- Flow export API→VariableData definitions/modes array→UI JSON→import API calls. API fixture assertions are explicitly host mocks; not real Figma execution.
- Figma.app is installed. No isolated Figma document/plugin test environment supplied; don't mutate user's Figma collections. Actual UI-host round-trip will remain incomplete unless an isolated safe host can be established within authorized file-only audit scope.
- Potential array schema mismatch: exporter emits definitions, importer recursively treats array indices/properties as variable paths. Validate with captured API calls and object-format control.

## Results and BH-0022 (P1, confirmed at API call boundary)

- Existing export test: 1 PASS ([log](../evidence/0033-tests.log)); new `tests/bug-hunt-roundtrip.test.ts`: legacy object control PASS, current exported definitions FAIL ([log](../evidence/0033-roundtrip.log)).
- Actual getCollectionVariables exports space/base=16 as `{namespace:'space',key:'base',value:16}` in variables array. Passing this public result to setCollectionVariables calls createVariable with `0/namespace`, `0/key`, `0/value` instead of `space/base`. This captures actual implementation calls against an explicit Figma API mock; no real Figma data edited.
- Source `packages/figma/src/features/setCollectionVariables.ts:52-60,107-108` recursively consumes definitions as a legacy object; `getCollectionVariables.ts:69-88` emits array schema. Impact importing the plugin's own export creates unrelated metadata-named variables and loses original variables/modes. Fix normalize both supported VariableData shapes into named definitions/mode values before API calls; test object/definitions/modes/aliases/type updates.
- Figma lint PASS; separate build:plugin/build:ui commands PASS; manifest's plugin and both HTML outputs exist. No race failure observed in concurrent UI build.
- `node .ai/audits/bug-hunt/repros/browser-smoke.mjs packages/figma/out figma`: actual Chromium built UI, mock parent RPC, invalid JSON recovery, valid request/response and enabled button PASS ([log](../evidence/0033-ui-browser.log)). Initial CJS dynamic-import harness mismatch fixed before UI tests.
- postAndWaitForMessage has 5s timeout plus abort cleanup; infinite-wait hypothesis excluded by source. Actual Figma collection API execution/UI host not run; isolated mock contract and real browser UI are the bounded checks. No production edits. Completed.
