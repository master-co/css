import { createEngineSync } from '../../../../packages/css/src/node.ts'
import { compileRenderedStylesheet } from '../../../../packages/compiler/src/stylesheet/index.ts'
const manifest = { version: 1, variables: { color: [
  { key: 'brand', value: 'var(--color-base)', dependencies: ['color-base'], static: true },
  { key: 'base', value: 'red' }
] }, utilities: [] }
const engine = createEngineSync({ manifest })
console.log('INITIAL', JSON.stringify(engine.snapshot()))
engine.ensureClassRules(['fg:brand'])
console.log('ENSURED', JSON.stringify(engine.snapshot()))
engine.deleteClassRules(['fg:brand'])
console.log('DELETED', JSON.stringify(engine.snapshot()))
engine.dispose()
const css = '@theme { --color-base: red; } @theme static { --color-brand: var(--color-base); }'
const compiled = await compileRenderedStylesheet('/audit.css', css, {})
console.log('PUBLIC-COMPILER', JSON.stringify({ manifest: compiled.manifest, generatedCSS: compiled.generatedCSS }))
