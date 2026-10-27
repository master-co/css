import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, expect, test } from 'vitest'
import defaultManifestJSON from '@master/css-preset/default-manifest.json' with { type: 'json' }
import type { MasterCSSManifest } from '@master/css-schema/manifest'
import { createCompilerBindingSessionSync } from '@master/css-binding/compiler/node'
import { loadProjectManifest } from '../src/project/manifest'
import { compileRenderedStylesheet, compileStylesheet } from '../src/stylesheet/index-public'
import { stylesheetResourceOwner } from '../src/node-imports'

const baseManifest = defaultManifestJSON as unknown as MasterCSSManifest
const temporaries: string[] = []
afterAll(() => { for (const directory of temporaries) rmSync(directory, { recursive: true, force: true }) })

/** The same project at a distinct absolute root, as in another checkout or CI runner. */
function checkout(layout: string, name = 'app') {
  const temporary = realpathSync(mkdtempSync(join(tmpdir(), 'master-keyframe-owner-')))
  temporaries.push(temporary)
  const root = join(temporary, layout)
  const write = (file: string, source: string) => {
    mkdirSync(dirname(join(root, file)), { recursive: true })
    writeFileSync(join(root, file), source)
  }
  write('package.json', JSON.stringify({ name }))
  write('styles/entry.css', '@import "@master/css";@import "./motion.css";@import "./esm/fade.css";')
  write('styles/motion.css', '@keyframes slide{to{opacity:1}}.slider{animation:slide 1s}')
  write('styles/esm/package.json', '{"type":"module"}')
  write('styles/esm/fade.css', '@keyframes slide{to{opacity:1}}.fader{animation:slide 1s}')
  return { root, entry: join(root, 'styles/entry.css') }
}

/** Source provenance keeps the checkout path; keyframe identities must not. */
function projectKeyframes(manifest: MasterCSSManifest, root: string) {
  return (manifest.keyframes ?? []).flatMap(({ id, ownerId, slotId, source }) => source?.file?.startsWith(root)
    ? [{ id, ownerId, slotId, file: source.file.slice(root.length) }]
    : [])
}

const first = checkout('a')
const second = checkout('deeper/checkout/b')

test('package-relative owners replace checkout paths for project stylesheets', () => {
  for (const { root } of [first, second]) {
    expect(stylesheetResourceOwner(join(root, 'styles/motion.css'))).toBe('app/styles/motion.css')
    // Nameless nested manifests do not name a package.
    expect(stylesheetResourceOwner(join(root, 'styles/esm/fade.css'))).toBe('app/styles/esm/fade.css')
  }
  expect(stylesheetResourceOwner(fileURLToPath(new URL('../../preset/src/theme.css', import.meta.url))))
    .toBe('@master/css-preset/src/theme.css')
  expect(stylesheetResourceOwner('\0virtual.css')).toBe('\0virtual.css')
})

test('project manifests produce identical keyframe IDs from different checkout roots', async () => {
  const [a, b] = await Promise.all([first, second].map(({ root, entry }) => loadProjectManifest({ root, entries: [entry], baseManifest })))
  const keyframes = projectKeyframes(a.manifest, first.root)
  expect(keyframes).toHaveLength(2)
  expect(projectKeyframes(b.manifest, second.root)).toEqual(keyframes)
  // Identical text in different files keeps independent definitions and owners.
  expect(keyframes[0].ownerId).not.toBe(keyframes[1].ownerId)
  expect(keyframes[0].id).not.toBe(keyframes[1].id)
  // The native filesystem host derives the same owners as the Node host.
  const binding = createCompilerBindingSessionSync()
  try {
    const native = binding.loadProjectManifest(first.root, baseManifest, [first.entry]) as { manifest: MasterCSSManifest }
    expect(projectKeyframes(native.manifest, first.root).map(({ ownerId }) => ownerId)).toEqual(keyframes.map(({ ownerId }) => ownerId))
  } finally { binding.dispose() }
  const renamed = checkout('a', 'other')
  const other = await loadProjectManifest({ root: renamed.root, entries: [renamed.entry], baseManifest })
  expect(projectKeyframes(other.manifest, renamed.root)[0].ownerId).not.toBe(keyframes[0].ownerId)
})

test('delivered stylesheet CSS is byte-identical across checkout roots', async () => {
  const compile = async ({ root, entry }: typeof first) => {
    const graph = await compileRenderedStylesheet(entry, readFileSync(entry, 'utf8'), {
      baseManifest, projectDir: root,
      // Package files outside the checkout resolve to one shared installation.
      delivery: { entryURL: '/entry.css', stylesheetURL: file => `/${encodeURIComponent(file.startsWith(root) ? file.slice(root.length) : file)}`, resourceURL: file => file }
    })
    const single = await compileStylesheet(join(root, 'styles/motion.css'), readFileSync(join(root, 'styles/motion.css'), 'utf8'), { baseManifest, projectDir: root })
    return { graph: graph.stylesheets!.map(({ css }) => css), single: single.css }
  }
  const a = await compile(first)
  expect(a.graph.join('\n')).toContain('master-css-keyframe-')
  expect(await compile(second)).toEqual(a)
})
