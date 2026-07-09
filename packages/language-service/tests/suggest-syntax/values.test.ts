import { test, it, expect, describe } from 'vitest'
import dedent from 'ts-dedent'
import { hint } from './helper'
import { CompletionItemKind } from 'vscode-languageserver-protocol'
import { createPresetManifest } from '../helpers/create-preset-manifest'
import CSSLanguageService from '../../src/core'
import createDoc from '../../src/utils/create-doc'

test.todo('convert any color spaces to RGB and hint correctly')

function cssComposeHint(target: string, settings: ConstructorParameters<typeof CSSLanguageService>[0] = {}) {
  const contents = ['.btn { @compose ', target, '; }']
  const doc = createDoc('css', contents.join(''))
  const languageService = new CSSLanguageService(settings)
  return languageService.suggestSyntax(doc, doc.positionAt(contents[0].length + target.length), {
    triggerKind: 2,
    triggerCharacter: target.charAt(target.length - 1)
  })
}

it.concurrent('should ignore values containing blanks', () => expect(hint('font-family:')?.map(({ label }) => label)).not.toContain('Arial, Helvetica, sans-serif'))
it.concurrent('types | delimiter', () => expect(hint('b:1px|')?.map(({ label }) => label)).toContain('solid'))
it.concurrent('types , separator', () => expect(hint('shadow:1px|1px|2px|black,')?.map(({ label }) => label)).toContain('inset'))
it.concurrent('ends with @ and not to hint values', () => expect(hint('text-center@')?.map(({ label }) => label)).not.toContain('center'))
it.concurrent('ends with : and not to hint values', () => expect(hint('text-center:')?.map(({ label }) => label)).not.toContain('center'))

describe.concurrent('ambiguous', () => {
  test.concurrent('removed fixed text aliases', () => {
    const labels = hint('text:')?.map(({ label }) => label)

    expect(labels).not.toContain('capitalize')
    expect(labels).not.toContain('center')
  })
})

describe.concurrent('detail and documentation', () => {
  test.concurrent('font:', () => expect(hint('font:')?.find(({ label }) => label === 'sans')).toEqual({
    detail: '(scope) var(--font-sans, ui-sans-serif), system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"',
    kind: CompletionItemKind.Value,
    label: 'sans',
    sortText: 'aaaasans',
    documentation: {
      kind: 'markdown',
      value: dedent`
          \`\`\`css
          @layer theme {
            :root {
              --font-family-sans: var(--font-sans, ui-sans-serif), system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
            }
          }
          @layer utilities {
            .font\\:sans {
              font-family: var(--font-family-sans)
            }
          }
          \`\`\`
        `
    }
  }))
  test.concurrent('font-style:', () => expect(hint('font-style:')?.find(({ label }) => label === 'italic')).toEqual({
    detail: 'font-style: italic',
    kind: 12,
    label: 'italic',
    sortText: 'cccccitalic',
    documentation: {
      kind: 'markdown',
      value: dedent`
          \`\`\`css
          @layer utilities {
            .font-style\\:italic {
              font-style: italic
            }
          }
          \`\`\`
        `
    }
  }))
})

describe.concurrent('retype on no hints', () => {
  it.concurrent('"text:c"', () => expect(hint('text:c')?.length).toBeGreaterThan(0))
  it.concurrent('"display:b"', () => expect(hint('display:b')?.find(({ label }) => label === 'block')).toMatchObject({
    label: 'block',
    kind: 12,
    sortText: 'cccccblock',
    detail: 'display: block'
  }))
})

describe.concurrent('negative values', () => {
  it.concurrent('should hint negative values', () => expect(hint('font:')?.map(({ label }) => label)).not.toContain('-bold'))
  test.todo('types - to hint number values')
})

describe.concurrent('key aliases', () => {
  test.concurrent('radius alias values use canonical radius utility', () => {
    expect(hint('rtr:')?.map(({ label }) => label)).toContain('md')
  })

  test.concurrent('native value namespace alias values use canonical property namespace', () => {
    expect(hint('w:')?.map(({ label }) => label)).toContain('sm')
    expect(hint('width:')?.map(({ label }) => label)).toContain('sm')
  })

  test.concurrent('background alias values include raw utility color scopes and native values', () => {
    const settings = {
      manifest: createPresetManifest({
        variables: [
          { namespace: 'color', key: 'accent', value: '#123456' }
        ]
      })
    }
    const labels = hint('bg:', settings)?.map(({ label }) => label) || []

    expect(labels).toEqual(expect.arrayContaining(['accent', 'blue', 'cover']))
    expect(labels.filter((label) => label === 'blue')).toHaveLength(1)
  })

  test.concurrent('CSS @compose background alias values include raw utility color scopes', () => {
    const settings = {
      manifest: createPresetManifest({
        variables: [
          { namespace: 'color', key: 'accent', value: '#123456' }
        ]
      })
    }
    const labels = cssComposeHint('bg:', settings)?.map(({ label }) => label) || []

    expect(labels).toEqual(expect.arrayContaining(['accent', 'blue', 'cover']))
    expect(labels.filter((label) => label === 'blue')).toHaveLength(1)
  })

  test.concurrent('vendor-prefixed text-size-adjust values use unprefixed syntax data', () => {
    for (const property of ['-webkit-text-size-adjust', '-moz-text-size-adjust', '-ms-text-size-adjust']) {
      expect(hint(property + ':')?.map(({ label }) => label)).toEqual(expect.arrayContaining(['auto', 'none']))
    }
  })
})

describe.concurrent('sorting', () => {
  test.concurrent('colors', () => {
    expect(
      hint('fg:')
        ?.filter(({ label }) => label.startsWith('yellow'))
        ?.map(({ label }) => label)
    ).toEqual([
      'yellow-0',
      'yellow-5',
      'yellow-10',
      'yellow-20',
      'yellow-30',
      'yellow-40',
      'yellow-50',
      'yellow-60',
      'yellow-70',
      'yellow-80',
      'yellow-90',
      'yellow-95',
      'yellow-100',
      'yellow'
    ])
  })

  test.concurrent('base hue and text color aliases', () => {
    const labels = hint('fg:')?.map(({ label }) => label)

    expect(labels).toEqual(expect.arrayContaining([
      'blue',
      'link',
      'muted',
      'pink',
      'strong',
      'text-blue',
      'text-link',
      'text-muted',
      'text-pink'
    ]))
    expect(labels).not.toContain('accent')
    expect(labels).not.toContain('danger')
    expect(labels).not.toContain('text')
    expect(labels).not.toContain('on-blue')
    expect(labels).not.toContain('line-blue')
    expect(labels).not.toContain('blue-surface')
  })

  test.concurrent('surface aliases', () => {
    const labels = hint('surface:')?.map(({ label }) => label)

    expect(labels).toEqual(expect.arrayContaining([
      'base',
      'muted',
      'raised',
      'overlay',
      'inverse'
    ]))
    expect(labels).not.toContain('blue')
    expect(labels).not.toContain('canvas')
  })

  test.concurrent('unitful numeric variables', () => {
    const labels = new Set(['test-tiny', 'test-small', 'test-medium'])
    expect(
      hint('w:', {
        manifest: createPresetManifest({
          variables: [
            {
              name: 'container-test-medium',
              namespace: 'container',
              key: 'test-medium',
              type: 'number',
              value: '2rem',
              numeric: { value: 2, unit: 'rem' }
            },
            {
              name: 'container-test-tiny',
              namespace: 'container',
              key: 'test-tiny',
              type: 'number',
              value: '8px',
              numeric: { value: 8, unit: 'px' }
            },
            {
              name: 'container-test-small',
              namespace: 'container',
              key: 'test-small',
              type: 'number',
              value: '1rem',
              numeric: { value: 1, unit: 'rem' }
            }
          ]
        })
      })
        ?.filter(({ label }) => labels.has(label))
        ?.map(({ label }) => label)
    ).toEqual([
      'test-tiny',
      'test-small',
      'test-medium'
    ])
  })
})

describe.concurrent('functions', () => {
  test.todo('fucntions')
})
