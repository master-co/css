# Batch 0203: LSP manifest diagnostic contract

## Classification

The preexisting LSP failure is an obsolete test expectation, not a new product bug.558sources/471artifacts exactlymatched0202. `createManifestLoadingDiagnostics` deliberately preserves `MasterCSSDiagnostic.code`; generic `manifest-loading-error` applies only to errors withoutstructured diagnostics. Commit8690b579e introducedthisbehavior andanexistingtest explicitlyrequires preserving an injected `manifest-directive-error` code.

The real invalid-manifestfixture now produces a compiler `MasterCSSError` with diagnostic `compose-quoted-syntax`, sourceindex.css, line3characters11–18. The openHTMLdocument correctly receives thatcode andtheloadingmessageprefix atzero range because theerror belongs toanotherfile. Replacing productcodewithagenericfallback would discardusefulstructuredinformation andcontradict theexistingstructuredcontract.

## Evidence

- [Three new controls](../../../../packages/language-server/tests/bug-hunt-manifest-diagnostic-contract.test.ts): actualfixtureerrorcodeandmessagepreserved;ordinaryError andlegacyCSSDirectiveError retain generic loading code.3PASS.
- [Delivered-package repro](../repros/lsp-manifest-diagnostics.mjs): `node .ai/audits/bug-hunt/repros/lsp-manifest-diagnostics.mjs`. ActualdeliveredLSP/compiler,readonlyexistingfixture, captured diagnostics,notificationstub; no transportserver orforeignhost. Finalexit0;fulloriginalandpublished payloads in0203-built-diagnostic-control-final.log.
- [Contract history](../evidence/0203-structured-contract-history.log): originalstructuredmappingchange preservedverbatim.
- [One-line test patch](../repros/lsp-structured-manifest-expectation.patch): onlychange expectedcodefrommanifest-loading-error tocompose-quoted-syntax. Copiedoriginalsuiteplus3newcontrols gives42PASS; [candidate](../evidence/0203-migration-candidate.json). Rootexistingtest was unchanged atcandidatecheckpoint; the user subsequentlyauthorizedandappliedtheone-linepatch.
- LSP package lint/types PASS. Noexistingfixture/snapshot touched;productionandall471artifacts unchanged.

## Harness corrections

Initialnewtest usedinstanceof against adifferentlyloaded MasterCSSError constructor;existingproductionhelperalreadyhandlesname/structuredfields acrossmoduleidentity. Correctedtest uses thathelper, retainingstrictcode/sourceassertions. Thiswas atestassumptionerror,notaproductfailure.

Initialstandaloneprobe assertionspassedbutrawstreamdestructiontriggeredvscode-languageserver's intentionalprocess.exit(1). SwitchingtoMessageReader/Writer removedthatimplicitrawstreamlifecycle; anunconnected pendingnotification thenrejectedondisposal. Thefinaldiagnostic-onlyprobe explicitlystubsnotifications,likeitsdiagnosticcapture, andexits0. Failedlogs remainverbatim; nonecountasproductbugsorcompletedtransportverification.

## Handoff and remaining work

Userapprovalrequestedforchangingoneexistingtest becausepreviousscopeallowedminimalnewtests. The user explicitly answered「授權這一行測試修正」. The single-linepatch is nowapplied. FullworkspaceLSP42tests,lintandtype-checkPASS. No productpatch needed.

Countsremain61historical/57fixed/4unresolved and65checked/10blocked. Allretainedraw/host/watch/gate/benchmark/Site requirementsarecopiedin [finalchecks](../evidence/0203-final-checks.json).0038additionalverificationstillawaitsexplicitidentityconfirmation. No commit/push;goalactive.Finalsourcecount is recorded in0203-final-checks.json;471artifacts unchanged;allownedcommands terminal.

## Final approved validation

`0203-approved-lsp-tests.log`:9files/42testsPASS. Approvedlint/types exit0. Onlytheauthorizedexistingexpectationchanged;3newcontrols distinguishrealstructuredcompilererrors fromgenericandlegacyfallbacks. No productbugIDorcountchange. AllpriorremainingrequirementsretainedexceptthiscompletedLSPtest-contractmigration. No commit/push;goalactive.
