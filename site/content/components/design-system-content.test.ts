import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { test } from 'node:test'
import masterCSS from '@master/eslint-config-css'
import { createRenderSessionSync } from '@master/css/node'
import { Linter } from 'eslint'
import preset from '../../utils/preset-manifest'
import { cascadeProbe, designSystemGuides, galleryPlacements, surfaceModeValues } from './design-system-content'
import { cascadeLayers, themeVariablesCode } from './home-content'

const linter = new Linter({ configType: 'flat' })
const config: Linter.Config[] = [...masterCSS, {
  files: ['**/*.jsx'],
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  rules: { '@master/css/no-invalid-classes': ['error', { disallowUnknownClass: true }] }
}]

test('the gallery places its photos with valid, sorted span classes', () => {
  for (const { className } of galleryPlacements) {
    const messages = linter.verify(`const sample = <span class="${className}"></span>`, config, { filename: 'home.jsx' })
    assert.deepEqual(messages, [], className)
  }
})

test('the theme preview tints the light-dark() values the token sample declares', () => {
  const [, light, dark] = themeVariablesCode.match(/--color-surface-base: light-dark\(\s*([^,]+),\s*([^)]+\))\s*\)/) ?? []
  assert.deepEqual([light, dark], surfaceModeValues.map((mode) => mode.value))
  for (const mode of surfaceModeValues) assert.equal(mode.value, `var(--color-${mode.colorName}-${mode.level})`)
})

test('the cascade probe follows a utility the engine puts in a later layer than components', () => {
  assert.deepEqual([...cascadeProbe.classes], [cascadeProbe.component, cascadeProbe.utility])
  const engine = createRenderSessionSync({ manifest: preset })
  try {
    const [rule] = engine.ensureClassRules([cascadeProbe.utility]).classRules[cascadeProbe.utility]
    const layers = cascadeLayers.map((layer) => layer.name as string)
    assert.ok(layers.indexOf(rule.layer!) > layers.indexOf('components'), rule.layer)
  } finally {
    engine.dispose()
  }
})

test('every design system figure links to a guide page that exists', () => {
  for (const href of Object.values(designSystemGuides)) {
    assert.match(href, /^\/guide\/[\w-]+$/)
    assert.ok(existsSync(new URL(`../${href.slice(1)}/page.tsx`, import.meta.url)), href)
  }
})
