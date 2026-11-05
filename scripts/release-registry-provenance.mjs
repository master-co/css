import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { isAbsolute, join } from 'node:path'
import { setTimeout as pause } from 'node:timers/promises'
import { execa } from 'execa'
import { npmRegistry } from './npm-oidc.mjs'

const repository = 'https://github.com/master-co/css'
const repositoryId = '434642460'
const workflow = '.github/workflows/release.yml'
const issuer = 'https://token.actions.githubusercontent.com'
const predicate = 'https://slsa.dev/provenance/v1'
const runner = 'github-hosted'
const retryDelays = [1000, 2000, 4000, 8000]
const maxResponseBytes = 4 * 1024 ** 2
const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const refPattern = /^refs\/heads\/(?:main|alpha|beta|rc|canary)$/

function expectedAttestation(pkg, version, revision, ref) {
  assert.ok(/^@master\/[a-z0-9][a-z0-9_.-]*$/.test(pkg.name), 'Unexpected npm provenance package')
  assert.ok(/^sha512-[A-Za-z0-9+/]{86}==$/.test(pkg.integrity), `Invalid archive integrity: ${pkg.name}`)
  const encoded = pkg.integrity.slice(7)
  const bytes = Buffer.from(encoded, 'base64')
  assert.ok(bytes.length === 64 && bytes.toString('base64') === encoded, `Invalid archive integrity: ${pkg.name}`)
  assert.ok(/^[1-9]\d*:[1-9]\d*$/.test(pkg.uploadRun ?? ''), `Missing exact npm upload run: ${pkg.name}`)
  const [runId, attempt] = pkg.uploadRun.split(':')
  assert.ok([runId, attempt].every(value => Number.isSafeInteger(Number(value))), `Invalid npm upload run: ${pkg.name}`)
  assert.ok(['push', 'workflow_dispatch'].includes(pkg.uploadEvent), `Invalid npm upload event: ${pkg.name}`)
  return {
    name: pkg.name, version, revision, ref,
    url: `${npmRegistry}-/npm/v1/attestations/${pkg.name.replace('/', '%2f')}@${version}`,
    purl: `pkg:npm/${pkg.name.replace('@', '%40')}@${version}`,
    sha512: bytes.toString('hex'),
    workflowIdentity: `${repository}/${workflow}@${ref}`,
    invocation: `${repository}/actions/runs/${runId}/attempts/${attempt}`,
    event: pkg.uploadEvent
  }
}

async function readAttestation(expected, fetchMetadata) {
  for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
    let response
    try {
      response = await fetchMetadata(expected.url, {
        headers: { accept: 'application/json', 'cache-control': 'no-cache' },
        redirect: 'error', signal: AbortSignal.timeout(15_000)
      })
    } catch {
      // A transport failure can be retried. Never expose raw provider errors.
    }
    if (response?.status === 200) {
      let size = 0
      const chunks = []
      try {
        for await (const chunk of response.body) {
          size += chunk.length
          assert.ok(size <= maxResponseBytes)
          chunks.push(Buffer.from(chunk))
        }
      } catch {
        throw new Error(`Invalid or oversized npm attestation response: ${expected.name}`)
      }
      return Buffer.concat(chunks)
    }
    if (response) {
      await response.body?.cancel().catch(() => {})
      assert.ok(response.status === 404 || response.status === 429 || response.status >= 500,
        `npm attestation request failed (HTTP ${response.status}): ${expected.name}`)
    }
    if (attempt < retryDelays.length) await pause(retryDelays[attempt])
  }
  throw new Error(`npm attestation unavailable: ${expected.name}`)
}

function parseJSON(bytes, label, name) {
  try { return JSON.parse(bytes) } catch { throw new Error(`Invalid ${label}: ${name}`) }
}

function readStatement(body, expected) {
  const records = parseJSON(body, 'npm attestation JSON', expected.name)?.attestations
  assert.ok(Array.isArray(records), `Missing npm attestation inventory: ${expected.name}`)
  const matches = records.filter(item => item?.predicateType === predicate)
  assert.ok(matches.length === 1, `Expected exactly one npm SLSA provenance attestation: ${expected.name}`)
  const bundle = matches[0].bundle
  const envelope = bundle?.dsseEnvelope
  assert.ok(envelope?.payloadType === 'application/vnd.in-toto+json' && typeof envelope.payload === 'string',
    `Missing npm provenance DSSE envelope: ${expected.name}`)
  const statement = parseJSON(Buffer.from(envelope.payload, 'base64'), 'npm provenance statement', expected.name)
  const { subject, predicate: statementPredicate } = statement ?? {}
  assert.ok(statement?._type === 'https://in-toto.io/Statement/v1' && statement.predicateType === predicate,
    `Unexpected npm provenance statement type: ${expected.name}`)
  assert.ok(Array.isArray(subject) && subject.length === 1 && subject[0]?.name === expected.purl && subject[0]?.digest?.sha512 === expected.sha512,
    `npm provenance subject or archive digest differs: ${expected.name}`)
  const build = statementPredicate?.buildDefinition
  const source = build?.externalParameters?.workflow
  const dependencies = build?.resolvedDependencies
  assert.ok(build?.buildType === 'https://slsa-framework.github.io/github-actions-buildtypes/workflow/v1'
    && source?.repository === repository && source.path === workflow && source.ref === expected.ref
    && build.internalParameters?.github?.repository_id === repositoryId
    && Array.isArray(dependencies) && dependencies.length === 1
    && dependencies[0]?.uri === `git+${repository}@${expected.ref}`
    && dependencies[0]?.digest?.gitCommit === expected.revision,
  `npm provenance repository, workflow, ref or revision differs: ${expected.name}`)
  const details = statementPredicate?.runDetails
  assert.ok(build.internalParameters.github.event_name === expected.event
    && details?.builder?.id === `https://github.com/actions/runner/${runner}`
    && details.metadata?.invocationId === expected.invocation,
  `npm provenance upload run, event or hosted builder differs: ${expected.name}`)
  return bundle
}

async function createSignatureVerifier(directory, run, env, workflowIdentity) {
  try {
    const userconfig = join(directory, 'user.npmrc'), globalconfig = join(directory, 'global.npmrc')
    await Promise.all([writeFile(userconfig, '', { mode: 0o600 }), writeFile(globalconfig, '', { mode: 0o600 })])
    const npm = await run('npm', ['root', '--global'], { cwd: directory, extendEnv: false, timeout: 30_000,
      env: { PATH: env.PATH, NPM_CONFIG_USERCONFIG: userconfig, NPM_CONFIG_GLOBALCONFIG: globalconfig,
        NPM_CONFIG_CACHE: join(directory, 'npm-cache') } })
    const root = npm.stdout.trim()
    assert.ok(isAbsolute(root) && !/[\r\n]/.test(root))
    const require = createRequire(join(root, 'npm', 'package.json'))
    assert.ok(require('./package.json').version === '11.21.0')
    const { ASN1Obj, X509Certificate } = require('@sigstore/core')
    const verifier = await require('sigstore').createVerifier({
      tufCachePath: join(directory, 'tuf'), retry: 1, timeout: 10_000, tlogThreshold: 1, ctLogThreshold: 1,
      certificateIdentityURI: '^' + workflowIdentity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$',
      certificateIssuer: issuer
    })
    return async (bundle, expected) => {
      const material = bundle.verificationMaterial
      // The pinned npm SDK emits v0.3 with a single certificate. Check claims
      // on exactly the certificate used for the signature, without oneof ambiguity.
      assert.ok(bundle.mediaType === 'application/vnd.dev.sigstore.bundle.v0.3+json' && typeof material?.certificate?.rawBytes === 'string'
        && !Object.hasOwn(material, 'x509CertificateChain') && !Object.hasOwn(material, 'publicKey'),
      `Unexpected npm Sigstore certificate material: ${expected.name}`)
      let claims
      try {
        await verifier.verify(bundle)
        const certificate = X509Certificate.parse(Buffer.from(material.certificate.rawBytes, 'base64'))
        claims = new Map(certificate.extensions.map(extension => [extension.subs[0].toOID(), extension.subs.at(-1).value]))
        const values = Object.entries({ 9: expected.workflowIdentity, 10: expected.revision, 11: runner, 12: repository,
          13: expected.revision, 14: expected.ref, 15: repositoryId, 20: expected.event, 21: expected.invocation })
        assert.ok(values.every(([id, value]) => {
          const claim = claims.get(`1.3.6.1.4.1.57264.1.${id}`)
          return claim && ASN1Obj.parseBuffer(claim).value.toString('utf8') === value
        }))
      } catch {
        throw new Error(`npm Sigstore signature or Fulcio source claims failed verification: ${expected.name}`)
      }
    }
  } catch {
    throw new Error('Could not initialize the isolated npm 11.21.0 Sigstore verifier')
  }
}

export function assertReleaseProvenanceProof(state, proof = state.provenanceProof) {
  assert.equal(proof?.cryptographicProvenanceVerified, true, 'Release requires verified cryptographic npm provenance')
  assert.equal(proof.schemaVersion, 1, 'Unsupported npm provenance proof')
  assert.equal(proof.version, state.version, 'Provenance proof version differs')
  assert.equal(proof.revision, state.revision, 'Provenance proof revision differs')
  assert.ok(Array.isArray(proof.packages) && proof.verifiedCount === state.packages.length
    && proof.packages.length === state.packages.length, 'Provenance proof must cover the complete cohort')
  const key = pkg => [pkg.name, pkg.integrity, pkg.uploadRun, pkg.uploadEvent]
  const ordered = packages => packages.map(key).sort((a, b) => a[0].localeCompare(b[0]))
  assert.deepEqual(ordered(proof.packages), ordered(state.packages), 'Provenance proof must cover the exact package archives and upload identities')
  assert.ok(proof.packages.every(pkg => pkg.version === state.version && /^[a-f0-9]{64}$/.test(pkg.attestationSHA256)),
    'Provenance proof lacks the exact version or attestation digest')
}

export async function verifyReleaseProvenance({ state, context, manifests, fetchMetadata = fetch, run = execa, verifySignature }) {
  const { revision, version, packages } = state
  const ref = context.env?.GITHUB_REF
  assert.ok(/^[a-f0-9]{40}$/.test(revision) && versionPattern.test(version), 'Invalid npm release provenance identity')
  assert.ok(refPattern.test(ref), 'Use the exact formal release branch for provenance verification')
  assert.ok(Array.isArray(packages) && Array.isArray(manifests) && manifests.length === packages.length,
    'npm provenance requires the complete exact registry manifest cohort')
  const registry = new Map(manifests.map(manifest => [manifest?.name, manifest]))
  assert.ok(registry.size === manifests.length && new Set(packages.map(pkg => pkg.name)).size === packages.length,
    'Duplicate package in npm provenance cohort')
  const required = packages.filter(pkg => pkg.provenance)
  assert.ok(required.length > 0, 'No required npm provenance to verify')
  for (const pkg of packages) {
    const manifest = registry.get(pkg.name)
    assert.ok(manifest?.version === version && manifest.gitHead === revision && manifest.dist?.integrity === pkg.integrity,
      `Registry manifest identity differs for npm provenance: ${pkg.name}`)
  }
  const expected = required.map(pkg => expectedAttestation(pkg, version, revision, ref))
  for (const entry of expected) {
    assert.ok(registry.get(entry.name).dist.attestations?.url === entry.url, `Unexpected npm attestation URL: ${entry.name}`)
  }
  const directory = verifySignature ? null : await mkdtemp(join(tmpdir(), 'master-release-provenance-'))
  try {
    const verify = verifySignature ?? await createSignatureVerifier(directory, run, context.env, expected[0].workflowIdentity)
    const proofs = []
    for (const [index, entry] of expected.entries()) {
      const pkg = required[index]
      const body = await readAttestation(entry, fetchMetadata)
      const bundle = readStatement(body, entry)
      await verify(bundle, entry)
      proofs.push({ name: pkg.name, version, integrity: pkg.integrity, uploadRun: pkg.uploadRun, uploadEvent: pkg.uploadEvent,
        attestationSHA256: createHash('sha256').update(body).digest('hex') })
    }
    return { schemaVersion: 1, revision, version, verifiedCount: proofs.length, cryptographicProvenanceVerified: true, packages: proofs }
  } finally {
    if (directory) await rm(directory, { recursive: true, force: true })
  }
}
