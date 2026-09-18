import { mkdtempSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from 'vitest'
import loader from '../src/stylesheet-loader'

function compile(root: string, file: string, source: string) {
  const dependencies: string[] = []
  return new Promise<{ code: string, dependencies: string[] }>((resolve, reject) => loader.call({
    resourcePath: file,
    rootContext: root,
    getOptions: () => ({}),
    addDependency: (dependency: string) => { dependencies.push(dependency) },
    async: () => (error: Error | null, code?: string) => error ? reject(error) : resolve({ code: code!, dependencies })
  }, source))
}

function fixture(entrySource: string, childSource: string) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'next-graph-classification-')))
  const entry = join(root, 'entry.css')
  writeFileSync(entry, entrySource)
  writeFileSync(join(root, 'child.css'), childSource)
  return { root, entry, child: join(root, 'child.css'), remove: () => rmSync(root, { recursive: true, force: true }) }
}

/** Flattening the graph to classify refused a qualified import whose child kept
 *  its own external import, failing the build before the delivery path this
 *  loader compiles with — which keeps the files apart — ever ran. */
test.each([
  ['a named layer', 'layer(cards)'],
  ['an anonymous layer', 'layer'],
  ['supports and media', 'supports(display:grid) screen']
])('BH-0004 an entry importing an external-importing child through %s compiles', async (_name, qualifier) => {
  const source = `@master entry;@import "./child.css" ${qualifier};`
  const f = fixture(source, '@import "https://external.invalid/style.css";.child{color:red}')
  try {
    const { code, dependencies } = await compile(f.root, f.entry, source)
    expect(code).toMatch(/\.master\/stylesheets\//)
    expect(dependencies).toContain(f.child)
  } finally { f.remove() }
})
