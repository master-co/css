import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'
import { test } from 'node:test'
import { execa } from 'execa'
import { createWorkspaceRelease, packedManifest, validatePackedManifest } from './semantic-release-workspace.mjs'

function archive(manifest) {
  const body = Buffer.from(JSON.stringify(manifest))
  const header = Buffer.alloc(512)
  header.write('package/package.json')
  header.write(body.length.toString(8).padStart(11, '0'), 124)
  return gzipSync(Buffer.concat([header, body, Buffer.alloc((512 - body.length % 512) % 512), Buffer.alloc(1024)]))
}

test('release versions all workspaces before packing and publishes verified tarballs with provenance', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'master-bun-release-'))
  const roots = ['packages/a', 'packages/b']
  const calls = []
  const credential = join(cwd, 'auth.npmrc')
  const plugin = createWorkspaceRelease({
    auth: async () => { await writeFile(credential, '//registry.npmjs.org/:_authToken=test'); return credential },
    run: async (command, args, options) => {
      calls.push({ command, args })
      if (command === 'bun') {
        for (const root of roots) assert.equal(JSON.parse(await readFile(join(cwd, root, 'package.json'))).version, '1.2.3')
        const manifest = JSON.parse(await readFile(join(options.cwd, 'package.json')))
        if (manifest.dependencies) manifest.dependencies['@fixture/b'] = '1.2.3'
        await writeFile(args[args.indexOf('--filename') + 1], archive(manifest))
      }
      return { stdout: '' }
    }
  })
  const context = { cwd, env: {}, nextRelease: { version: '1.2.3', channel: 'rc' } }
  try {
    for (const [index, root] of roots.entries()) {
      await mkdir(join(cwd, root), { recursive: true })
      await writeFile(join(cwd, root, 'package.json'), JSON.stringify({ name: `@fixture/${index ? 'b' : 'a'}`, version: '0.0.0', publishConfig: { provenance: true }, ...(index ? {} : { dependencies: { '@fixture/b': 'workspace:*' } }) }))
    }
    const config = { pkgRoot: roots[0], workspaceRoots: roots }
    await plugin.verifyConditions(config, context)
    await plugin.prepare(config, context)
    await plugin.prepare({ ...config, pkgRoot: roots[1] }, context)
    await plugin.publish(config, context)
    const publish = calls.find(call => call.args[0] === 'publish')
    assert.equal(publish.command, 'npm')
    assert.ok(publish.args.includes('--provenance'))
    assert.equal(publish.args[publish.args.indexOf('--tag') + 1], 'rc')
    assert.equal(packedManifest(await readFile(publish.args[1])).dependencies['@fixture/b'], '1.2.3')
    await plugin.addChannel(config, context)
    assert.ok(calls.some(call => call.command === 'npm' && call.args[0] === 'dist-tag'))
    assert.ok(calls.every(call => call.command !== 'pnpm'))
    await plugin.success()
    await assert.rejects(readFile(credential))
  } finally { await plugin.fail(); await rm(cwd, { recursive: true, force: true }) }
})

test('unresolved workspace dependencies and incorrect package identity fail validation', () => {
  assert.throws(() => validatePackedManifest({ name: 'a', version: '1', dependencies: { b: 'workspace:*' } }, 'a', '1'), /Unresolved workspace/)
  assert.throws(() => validatePackedManifest({ name: 'a', version: '0' }, 'a', '1'), /Incorrect release identity/)
  assert.throws(() => packedManifest(gzipSync(Buffer.alloc(1024))), /missing package/)
})

test('real Bun packing resolves workspace protocols after every release version is written', async () => {
  const cwd = await mkdtemp(join(tmpdir(), 'master-bun-real-pack-'))
  const roots = ['packages/a', 'packages/b']
  const plugin = createWorkspaceRelease({ run: (command, args, options) => {
    assert.equal(command, 'bun', 'this smoke must never publish')
    return execa(command, args, options)
  } })
  try {
    await writeFile(join(cwd, 'package.json'), JSON.stringify({ private: true, workspaces: ['packages/*'] }))
    for (const [index, root] of roots.entries()) {
      await mkdir(join(cwd, root), { recursive: true })
      await writeFile(join(cwd, root, 'package.json'), JSON.stringify({ name: `@fixture/${index ? 'b' : 'a'}`, version: '0.0.0',
        ...(index ? {} : { dependencies: { '@fixture/b': 'workspace:*' }, peerDependencies: { '@fixture/b': 'workspace:^' } }) }))
    }
    await plugin.prepare({ pkgRoot: roots[0], workspaceRoots: roots }, { cwd, env: process.env, nextRelease: { version: '3.2.1' } })
    const packed = packedManifest(await readFile(join(cwd, 'release-artifacts/packages/fixture-a-3.2.1.tgz')))
    assert.equal(packed.dependencies['@fixture/b'], '3.2.1')
    assert.equal(packed.peerDependencies['@fixture/b'], '^3.2.1')
  } finally { await plugin.fail(); await rm(cwd, { recursive: true, force: true }) }
})
