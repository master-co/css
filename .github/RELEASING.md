# Release verification and recovery

Publication and deployment are separate authorized actions. The commands in the
verification section only read npm or local archives. Passing them does not
authorize running the release workflow, publishing npm packages, changing tags,
publishing editor extensions, or deploying the site.

## Candidate evidence

Freeze one clean source revision and exact release version. Build all public
packages, all eight native targets and all three Wasm artifacts from that revision.
Keep the actual `createWorkspaceRelease.prepare` archives, the runtime JavaScript
and program assets, their checksums, and all verification reports together. Do not
substitute workspace links or an older audit tarball for the candidate.

The current cohort has 34 public workspace packages. Discover it from manifests;
do not maintain a second hand-written package list. The eight-target verification
workflow proves the assembled local candidate closure and native executables. It
does not prove that those packages exist on npm, that registry-only resolution
works, or that every other public package has been packed successfully.

Run these commands with the actual candidate values and a fresh output directory:

```sh
node scripts/release-readiness.mjs inventory --version "$VERSION" --output "$EVIDENCE/before.json"
node scripts/release-readiness.mjs inspect --archives "$ARCHIVES" --version "$VERSION" --revision "$REVISION" --output "$EVIDENCE/candidate.json"
node scripts/release-readiness.mjs rehearse --candidate "$EVIDENCE/candidate.json" --before "$EVIDENCE/before.json" --output "$EVIDENCE/rehearsal.json"
node --test scripts/release-readiness.test.mjs scripts/semantic-release-workspace.test.mjs scripts/semantic-release-promotion.test.mjs
```

`inspect` rejects missing or duplicate packages, unresolved workspace protocols,
incorrect versions, non-exact internal dependency pins, and native binaries in the
generic binding archive. It records each archive's SHA-512 and dependency order.
This is archive identity validation, not a substitute for installation tests.
`rehearse` models every interrupted upload and promotion boundary in memory. Its
mock outcomes are not evidence of an actual registry publication.

Rehearse the assembled archives without publishing after building every public
package and staging all eight native payloads:

```sh
node scripts/release-archive-consumers.mjs prepare --root "$CHECKOUT" --output "$EVIDENCE/archives" --version 0.0.0-archive.1 --native-revision "$NATIVE_REVISION"
node scripts/release-archive-consumers.mjs consume --input "$EVIDENCE/archives" --proof "$EVIDENCE/archive-consumers.json"
node --test scripts/release-archive-consumers.test.mjs
```

Use a fresh output directory. The native revision records the supplied payload
provenance; it does not verify that provenance or replace same-source native
target proofs. Final acceptance requires a clean approved source and matching
payload evidence. Missing native targets fail preparation unless `--host-only`
explicitly selects an incomplete rehearsal.

The consumer installs through an isolated loopback registry using npm, Bun and
pnpm, with fresh caches and disabled dependency lifecycle scripts. Every Master
dependency must match its candidate archive version and integrity. Host smoke
checks exercise native/Wasm, compiler, CLI, runtime, integrations, installer and
MCP; npm additionally builds packed Astro/Svelte fixtures and exercises the
browser runtime. The report records each manager's actual coverage. These local
tarball checks do not establish public package availability, registry provenance,
published-version installation, or other-platform execution.

Before authorizing publication, retain:

- Full validation, eight native consumers, Wasm/browser consumers, Windows
  compatibility, and packed editor-extension host evidence for the same revision.
- Fresh npm/Bun/pnpm consumer installations of the assembled archive cohort,
  including CLI, compiler, runtime, integrations, create-css and MCP. Verify that
  no workspace package silently resolves from npm instead of the candidate.
- Browser/CDN filenames and checksums, including `global.min.js` and
  `default-program.bin`, and the published `files`/`exports` inventory.
- The intended owner and Trusted Publisher configuration for every npm name.
  Public 404 responses do not establish whether a name is available to this
  account. Keep account identifiers, credentials and private authorization
  screenshots out of public issue bodies.

## Normal publication sequence

The semantic-release configuration runs workspace publication first, the cohort
promotion plugin next, and GitHub release creation last. The workspace plugins
publish dependencies before their dependents, including optional and peer
dependencies pinned to this cohort. Publication requires both explicit workflow flags:

```text
MASTER_CSS_RELEASE_STAGE=1
MASTER_CSS_RELEASE_PROMOTE=1
MASTER_CSS_RELEASE_STATE=release-artifacts/promotion-state.json
```

These flags are guards, not a replacement for authorization. Both are required by
the normal semantic-release invocation; setting only one is not a supported
stage-only release workflow. Use one release concurrency group and prevent an
operator or another workflow from writing the same tags concurrently.

1. `prepare` versions all workspaces before packing. Before the first npm write,
   record the source revision, full archive cohort and SHA-512 values, target
   channel baselines, workflow run identity and an empty operation log.
2. Publish each archive under `candidate-<exact-version>`. Record an upload attempt
   before calling npm once. Check that the candidate tag appears and no other tag
   changed, then verify the exact version, source revision, integrity and
   provenance metadata. Wait until npm's public install metadata lists the same
   archive before uploading a dependent package. npm scans new versions after
   accepting an upload; the workflow retries reads only and retains state on failure.
   Candidate tags do not hide a published version from exact or range installs.
   When a package has no `latest`, npm can select its first stable version for
   a bare install even before channel promotion.
3. The final promotion plugin verifies every package's exact version and integrity,
   then cryptographically verifies its public npm provenance. Sigstore verifies
   the signing certificate and transparency proof. The signed SLSA subject must
   bind the exact package version and archive to the recorded source, workflow,
   and upload run. Missing or inconsistent evidence stops before any formal tag
   write. The resulting cohort proof is retained with the release state and is
   required for editor and website delivery. Before promotion, install exact
   candidate engine/compiler/CLI versions from public npm
   in a fresh directory/cache without credentials, scripts, links or overrides.
   Check lockfile versions and SHA-512, physical manifests, native/Wasm parity,
   stacked conditions, explicit public PHP sources and CLI execution. Failure
   blocks all formal tag writes; retain the host consumer proof in the state.
4. Promote the formal channel one package at a time, checking the observed tag
   against its saved baseline immediately before each write, recording a pending
   operation first, and verifying the tag afterward. npm has no multi-package
   transaction or atomic compare-and-swap. Readers can observe a partially moved
   channel during promotion, but every candidate dependency already exists.
5. Only after all promotions succeed may semantic-release create the GitHub
   release. Keep editor publication and deployment held until their separate
   validation and authorization gates are met. A completed npm phase does not
   prove those downstream phases succeeded.

For a new name, [npm staged publishing](https://docs.npmjs.com/staged-publishing/)
can register the package before its first real release. Verify that the only
public version is npm's `0.0.0-stage` placeholder and keep the reservation in
staging without approval. Configure Trusted Publishing when the release is ready:
the first successful publish must validate a new connection within 48 hours.
Inspect the new name's exact version and tags after every first real write; do
not assume that npm will preserve the requested tag or assign no default.

Always upload `promotion-state.json` and the exact package archives, including on
failure. These files contain public package identities, checksums and tags, not
authentication tokens. Keep them with the source revision and run URL; losing the
state loses the original tag baselines and upload-attempt evidence.

After npm has been explicitly authorized and the candidate exists, use clean
temporary projects and empty package-manager caches to install from the registry
without local tarballs, overrides or workspace links. Check documented commands,
CLI execution, native/Wasm loading, runtime/browser assets and each integration.
Verify npm signatures/provenance for the installed packages with the supported
npm tooling and compare all fetched archive bytes with the recorded SHA-512.
Record registry-resolution results separately from pre-publication archive tests.
The promotion plugin runs the host registry consumer described above before any
formal tag write. It does not replace all-platform registry installations or the
complete integration/browser/CDN matrix. Keep those additional results separate.

The site snapshot publisher uses the same stage/verify/promote mechanism for its
actual dependency closure, not all 34 public packages, and moves only `site`. Its
state is `release-artifacts/site-toolchains/promotion-state.json`; the versioned
snapshot directories retain its archives. Its consumer covers engine/compiler
and PHP; it does not claim CLI coverage when CLI is outside that closure.

Use npm 11.21.0 for OIDC tag operations. Every applicable Trusted Publisher must
allow both direct publishing and **Allow npm dist-tag**; the latter is disabled by
default and is independent of publishing permission. Merely configuring a trusted
publisher does not prove tag authorization. Confirm these account settings before
authorized publication; do not exercise a real tag mutation as a preflight test.
See [npm's Trusted Publisher documentation](https://docs.npmjs.com/trusted-publishers/#managing-dist-tags-with-trusted-publishing)
and [npm 11.21.0's implementation](https://github.com/npm/cli/blob/v11.21.0/lib/commands/dist-tag.js).

## MCP Registry listing

After the stable npm release, set `VERSION` to the exact released
`@master/css-mcp` version and use it for both versions in `server.json`. Verify that
`npm view "@master/css-mcp@$VERSION" mcpName` matches `server.json`'s `name`.
Run the [package's client check](../packages/mcp/README.md#mcp-client-config) in
an empty workspace on Node.js 24, pinning the npm command to that version.

Validate with `mcp-publisher validate server.json`. A `master-co` GitHub
organization owner can authenticate with `mcp-publisher login github` and run
`mcp-publisher publish` from the repository root. The registry also supports
`mcp-publisher login github-oidc` in a workflow in this repository with
`id-token: write`. See the [official publishing guide](https://github.com/modelcontextprotocol/registry/blob/main/docs/modelcontextprotocol-io/quickstart.mdx).

Verify `server.packages` in the public response contains `@master/css-mcp` at
`$VERSION` with `stdio` transport:

```sh
curl --fail --silent --show-error "https://registry.modelcontextprotocol.io/v0.1/servers/io.github.master-co%2Fmaster-css/versions/$VERSION"
```

## Partial failure: inspect before retrying

Do not blindly rerun the release workflow or use `--skip-duplicate`. Retain the
failed run's state and archives, note its last verified operation, and sample npm
again. These commands remain read-only:

```sh
node scripts/release-readiness.mjs inventory --version "$VERSION" --output "$EVIDENCE/current.json"
node scripts/release-readiness.mjs plan --candidate "$EVIDENCE/candidate.json" --before "$EVIDENCE/before.json" --current "$EVIDENCE/current.json" --output "$EVIDENCE/recovery-plan.json"
```

For a prerelease channel, also pass `--tag rc` (or the actual formal channel).
The plan distinguishes absent versions, identical immutable versions needing
provenance/consumer verification, conflicting immutable versions, and changed
tags. It does not execute upload, promotion, rollback or deletion commands.

| Failure boundary | Required action before any authorized retry |
| --- | --- |
| No package uploaded | Fix the cause, confirm no registry versions exist, preserve the evidence, then retry the same candidate only with unchanged archives. |
| Some packages uploaded | Restore the exact archived state and every archive at the original relative paths. Check revision, full cohort, version, integrity and provenance. Resume only uploads that were never attempted; an existing version requires a recorded upload attempt and matching immutable bytes. An unresolved attempt with a missing public version stops for investigation. |
| Upload succeeded but its response/state update was lost | Inspect registry evidence, including npm's authenticated version status when available. A version under validation may be absent from the public registry. Explicit recovery may recognize the recorded attempt and identical version; it must verify the signature against the upload run recorded for that package. Never assume an npm error or a public 404 means no write occurred. |
| All uploads complete, no formal tags moved | Verify the complete registry cohort again, then resume promotion under the same exclusive release lock. |
| Some formal tags moved | Check every current tag against the saved baseline or recorded successful/pending promotion. Resume only after reconciling the partial state. Do not automatically roll back. |
| An immutable version has different bytes, missing required provenance, or the original state is unavailable | Stop. Never overwrite or unpublish the version to make a retry work. Choose a new version, rebuild the complete cohort, rerun verification and obtain authorization for that new candidate. |
| A tag changed outside this run | Stop and reconcile ownership; preserve the newer value. Read-before-write detects observed interference but cannot eliminate races without exclusive writers. |
| npm succeeded but Marketplace/Open VSX or site failed | Keep npm's completed evidence. Diagnose and authorize only the downstream retry. Do not bump an editor version or replay npm merely to bypass an existing publication. |

An explicitly authorized recovery run sets `MASTER_CSS_RELEASE_RECOVERY=1` in
addition to the normal guards, restores the archived state and archives, and uses
the same candidate revision/version. `prepare` can reuse verified archived bytes,
but do not resume by rerunning semantic-release: it creates a Git tag before npm
publication and may then select no new release on a retry. The explicit recovery
entrypoint bypasses semantic-release's version selection and Git writes:

```sh
# MUTATING: only in a separately authorized OIDC recovery workflow, never as a check.
node scripts/release-recover.mjs --state release-artifacts/promotion-state.json --channel latest
```

For a site snapshot use its saved state and `--channel site --scope site`. The
entrypoint resolves the archived package names against the checked-out source,
so the original temporary preparation workspace is not needed. Archive paths in
state are relative to the state file and remain portable when the whole evidence
directory is restored. It verifies all archived bytes, stages only missing
versions, reruns the registry host consumer and resumes recorded promotion steps.
It never creates/deletes Git tags or notes, creates a GitHub release, publishes an
editor extension, or deploys a site. Reconcile those downstream states separately. In particular, a channel recovered
outside semantic-release does not update its Git notes: the next normal release
remains blocked by the pending channel until an operator verifies completed npm
promotion and explicitly reconciles the semantic-release channel note, preserving
its existing channels. Do not delete/recreate release tags or alter notes merely
to silence that guard.

The `Release` workflow now has an explicit manual npm-only recovery mode. It uses
`release.yml`, preserving the configured npm Trusted Publisher workflow identity.
This is a mutating operation, not a validation run. After separate authorization:

1. Keep the formal branch (`main`, `alpha`, `beta`, `rc` or `canary`) at the exact
   failed candidate SHA. Select that branch in **Run workflow**. Recovery refuses
   another SHA, a tag ref or another branch. If the branch has advanced, this mode
   cannot recover the old candidate; do not rewind a shared branch to bypass it.
   Review a separately authorized recovery plan instead.
2. Enter the source Release run ID, its run attempt and the exact archived version.
   The source may be the original completed release run or a completed previous
   recovery run. Enter `RECOVER NPM ONLY` in the confirmation field. A stable branch
   requires a stable version; each prerelease branch requires its own prerelease.
3. The job verifies the repository and head-repository identities, Release workflow
   ID/path, source attempt, formal branch, exact SHA and completed run status. It
   accepts only the matching `npm-release-<SHA>-<attempt>` artifact, requires its
   GitHub SHA-256 digest, checks the downloaded ZIP against that digest, and rejects
   unsafe paths, symlinks and files outside the state/archive/checksum allowlist.
   Restored state must match the requested version, SHA and original channel
   baseline; every tarball must match its recorded SHA-512 before recovery starts.
4. The selected branch determines the original formal channel (`main` → `latest`).
   The job restores and verifies the full workspace cohort, reuses archived bytes,
   then resumes only the npm uploads and promotion permitted by that state. It
   retains updated state and archives even after a partial failure, for another
   explicitly authorized recovery. The state retains its original publication-run
   identity; later recovery artifact provenance is checked through GitHub run metadata
   and its ZIP digest, without rewriting that original identity. It never runs ordinary validation/publication,
   GitHub release creation, Git-note changes, editor publication or deployment.

The workflow does not automatically discover a failed run, restore an arbitrary
artifact or enable recovery on ordinary pushes. The GitHub download token has
read-only contents/actions permissions and is not passed to the npm recovery step
or artifact blob storage. npm uses this workflow's OIDC identity. Site-toolchain
snapshots are excluded from this main release recovery UI and still require their
own separately authorized original-workflow recovery plan. Changed source requires
a new candidate and fresh checks.

If rollback is chosen instead of resuming, review every saved prior channel value.
For each package still pointing to this candidate, restore the prior version;
where the channel was previously absent, remove only that channel. Re-read before
each authorized write and stop on interference. This is an operator procedure,
not automatic rollback; published versions remain immutable and available.

Automatic semantic-release `addChannel` is blocked in `verifyConditions`, before
semantic-release writes channel notes to Git. Use the explicit recovery entrypoint
for a channel change with archived evidence. The promotion implementation's
`addChannel` also requires the archived release state and package archives for the
same version/revision and validates the entire registry cohort. It does not
reconstruct old release evidence from the current checkout. Missing archived
evidence fails closed; automatic channel promotion without that evidence is not
supported.

## Registry baseline and historical reports

The read-only 2026-11-04 inventory found `@master/css@rc` at `2.0.0-rc.88` and
`latest` at `1.37.8`. Six current public names returned 404: `@master/css-next`,
`@master/css-nuxt`, `@master/css-svelte`, `@master/css-svelte-addon`,
`@master/css-vscode`, and `@master/css-webpack`. Fifteen other current packages
had only staging/site channels and no `rc` tag. Re-sample before release; these
observations do not mean the current source or documented install commands have
already been published.

- [#444](https://github.com/master-co/css/issues/444): the exact published rc.88
  engine/compiler reproduction still emits an invalid combined media condition
  for `bg:black@dark@sm`. Current native/Wasm engines reject that removed spelling
  and correctly nest both condition orders with `bg-black`. Until an updated
  release is available, write the affected rule as ordinary CSS using a valid
  `@media (prefers-color-scheme: dark) and (min-width: 52.125rem)` condition and a
  dedicated class. The current source regression is in
  `packages/css/tests/issues/444.test.ts`.
- [#465](https://github.com/master-co/css/issues/465): an isolated rc.88 Vite
  installation reproduces missing output when the reported PHP markup is inside
  `public/`; its scanner's default `**/public/**` exclusion wins over `@source`.
  Moving the same PHP template and unchanged classes into `app/Views/` and pointing
  `@source` there restores all five reported classes. Changing only the scanner
  exclusion override is insufficient because the old option merger retains the
  default exclusions. Current source tests explicit PHP sources under `public/`,
  with `italic` and current utilities, separately from rejecting removed colon
  spellings. This is source-fixed but does not alter already-published rc.88.

Keep #470's registry publication/registry-only installation gates open until they
have actually been exercised under publication authorization. A passing local
rehearsal and closed source defects do not satisfy those external-state gates.
