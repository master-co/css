import { test, it, expect, describe } from 'vitest'
import { hint } from './helper'
import { CompletionItemKind } from 'vscode-languageserver-protocol'
import { createPresetManifest } from '../helpers/create-preset-manifest'
import CSSLanguageService from '../helpers/rc87-language-service'
import createDoc from '../../src/utils/create-doc'

function labels(target: string, settings?: ConstructorParameters<typeof CSSLanguageService>[0]) {
  return hint(target, settings)?.map(({ label }) => label) ?? []
}

it('does not insert unencoded whitespace into values', () => expect(labels('font-family:')).not.toContain('Arial, Helvetica, sans-serif'))
it('continues native border values after a space delimiter', () => expect(labels('b:1px|')).toContain('solid'))
it('continues native shadow values after a comma', () => expect(labels('box-shadow:1px|1px|2px|black,')).toContain('inset'))
it('offers conditions after a named style', () => expect(labels('text-center@')).not.toContain('center'))
it('offers states after a named style', () => expect(labels('text-center:')).not.toContain('center'))

describe('named token completion', () => {
  test('describes the token identity and actual CSS', () => {
    const item = hint('font-')?.find(({ label }) => label === 'font-sans')
    expect(item).toMatchObject({
      label: 'font-sans', kind: CompletionItemKind.Value,
      detail: expect.stringContaining('(token --font-family-sans)'),
      documentation: { kind: 'markdown', value: expect.stringContaining('font-family: var(--font-family-sans)') }
    })
  })
  test('keeps native font values separate from font tokens', () => {
    expect(labels('font:')).not.toContain('sans')
    expect(labels('font-family:')).not.toContain('mono')
    expect(labels('font-')).toEqual(expect.arrayContaining(['font-mono', 'font-bold', 'font-sm']))
  })
  test('offers registered full prefixes and aliases', () => {
    expect(labels('rtr-')).toContain('rtr-md')
    expect(labels('w-')).toContain('w-sm')
    expect(labels('width-')).toContain('width-sm')
    expect(labels('font-family-')).toContain('font-family-mono')
  })
  test('does not suggest negative sizes or nonnumeric tokens', () => {
    expect(labels('-w-')).not.toContain('-w-md')
    expect(labels('-font-')).not.toContain('-font-bold')
    expect(labels('-m-')).toEqual(expect.arrayContaining(['-m-sm', '-m-md']))
  })
  test('keeps custom colors out of native value completion', () => {
    const settings = { manifest: createPresetManifest({ variables: [{ namespace: 'color', key: 'accent', value: '#123456' }] }) }
    expect(labels('bg-', settings)).toEqual(expect.arrayContaining(['bg-accent', 'bg-blue', 'bg-cover']))
    expect(labels('bg:', settings)).not.toContain('accent')
    expect(labels('bg:', settings)).toContain('cover')
  })
  test('offers named colors inside compose', () => {
    const settings = { manifest: createPresetManifest({ variables: [{ namespace: 'color', key: 'accent', value: '#123456' }] }) }
    const prefix = '.btn { @compose bg-'
    const doc = createDoc('css', prefix + '; }')
    const service = new CSSLanguageService(settings)
    const items = service.suggestSyntax(doc, doc.positionAt(prefix.length), { triggerKind: 1 })
    expect(items?.map(({ label }) => label)).toContain('bg-accent')
  })
})

describe('native declaration completion', () => {
  test('documents the native property without shorthand inference', () => {
    expect(hint('font-style:')?.find(({ label }) => label === 'italic')).toMatchObject({
      detail: 'font-style: italic', label: 'italic',
      documentation: { kind: 'markdown', value: expect.stringContaining('font-style: italic') }
    })
  })
  test('continues typing a native keyword', () => {
    expect(hint('display:b')?.find(({ label }) => label === 'block')).toMatchObject({ label: 'block', detail: 'display: block' })
  })
  test('uses native syntax data for vendor-prefixed properties', () => {
    for (const property of ['-webkit-text-size-adjust', '-moz-text-size-adjust', '-ms-text-size-adjust']) {
      expect(labels(property + ':')).toEqual(expect.arrayContaining(['auto', 'none']))
    }
  })
})

describe('token ordering', () => {
  test('sorts color shades numerically and keeps their base hue', () => {
    expect(labels('fg-').filter(label => label.startsWith('fg-yellow'))).toEqual([
      'fg-yellow-0', 'fg-yellow-5', 'fg-yellow-10', 'fg-yellow-20', 'fg-yellow-30', 'fg-yellow-40',
      'fg-yellow-50', 'fg-yellow-60', 'fg-yellow-70', 'fg-yellow-80', 'fg-yellow-90', 'fg-yellow-95', 'fg-yellow-100', 'fg-yellow'
    ])
  })
  test('preserves namespace fallback aliases', () => {
    const values = labels('fg-')
    expect(values).toEqual(expect.arrayContaining(['fg-blue', 'fg-link', 'fg-muted', 'fg-strong', 'fg-text-blue', 'fg-text-link']))
    expect(values).not.toContain('fg-accent')
    expect(values).not.toContain('fg-line-blue')
  })
  test('limits surface tokens to the registered namespace', () => {
    const values = labels('surface-')
    expect(values).toEqual(expect.arrayContaining(['surface-base', 'surface-muted', 'surface-raised', 'surface-overlay', 'surface-inverse']))
    expect(values).not.toContain('surface-blue')
  })
  test('compares unitful values for suggestions without rewriting declarations', () => {
    const settings = { manifest: createPresetManifest({ variables: [
      { namespace: 'container', key: 'test-medium', type: 'number', value: '2rem', numeric: { value: 2, unit: 'rem' } },
      { namespace: 'container', key: 'test-tiny', type: 'number', value: '8px', numeric: { value: 8, unit: 'px' } },
      { namespace: 'container', key: 'test-small', type: 'number', value: '1rem', numeric: { value: 1, unit: 'rem' } }
    ] }) }
    expect(labels('w-', settings).filter(label => label.startsWith('w-test-'))).toEqual(['w-test-tiny', 'w-test-small', 'w-test-medium'])
  })
})
