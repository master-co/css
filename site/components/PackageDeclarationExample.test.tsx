import '../scripts/bundler-imports'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { packageDeclaration } from '../utils/package-declaration'

const { default: PackageDeclarationExample } = await import('./PackageDeclarationExample')

test('loads the same scoped subpath declaration as the complete catalog', async () => {
  const identifier = '@master/css-compiler/diagnostics#MasterCSSInspectionReport'
  const catalog = JSON.parse(await readFile(new URL('../.generated/reference.json', import.meta.url), 'utf8'))
  const element = await PackageDeclarationExample({ identifier })
  assert.equal(element.props.children, packageDeclaration(identifier, catalog))
  assert.ok(element.props.children.length > 100)
})

test('reports unknown packages and unknown declarations', async () => {
  await assert.rejects(PackageDeclarationExample({ identifier: '@unknown/package#Missing' }), /Unknown package reference/)
  await assert.rejects(PackageDeclarationExample({ identifier: '@master/css-compiler#Missing' }), /Missing gallery declaration/)
})
