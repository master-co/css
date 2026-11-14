import { createMasterCSSCompilerWasmProvider } from '@master/css-binding-wasm-compiler'
import { createMasterCSSToolingWasmProvider } from '@master/css-binding-wasm-tooling'
import { afterEach, describe, expect, it } from 'vitest'
import { cssGrammar, MASTER_CSS_GRAMMAR_DATA, type MasterCSSGrammarProvider } from '../src/css-grammar'
import { cssGrammar as browserCSSGrammar } from '../src/css-grammar-browser'
import { registerCSSGrammar } from '../src/css-grammar-contract'
import { loadNativeBinding } from '../src/native-loader'

const registry = globalThis as Record<symbol, unknown>
const key = Symbol.for('@master/css-binding/css-grammar')
afterEach(() => { delete registry[key] })

const stylesheet = '.a{color:red;width:calc(1px + 2s);margin:var(--x)}@media (min-width:1px){.b{display:flex!important}}@font-face{font-display:swap;src:url(a.woff2)}.c{é:1px;color:#ggg}'

function results(provider: MasterCSSGrammarProvider) {
  return {
    version: provider.cssGrammarVersion(),
    syntax: ['.a{color:red}', '.a{color:(}', '.a{color:"x}'].map(text => provider.cssSyntaxStatus(text)),
    values: [['color', 'red'], ['color', '1px'], ['width', 'calc(1px + 1em)'], ['width', 'var(--x)'], ['font-display', 'swap', 'font-face']]
      .map(([property, value, atRule]) => provider.cssValueStatus(property, value, atRule)),
    declarations: provider.cssRuleDeclarationsJSON(stylesheet),
    errors: provider.validateCSSJSON(stylesheet),
    parsed: provider.parseCSSDeclarationsJSON(stylesheet)
  }
}

describe('CSS grammar', () => {
  it('checks CSS identically through the native and Wasm bindings', async () => {
    const native = loadNativeBinding({ required: true })!.binding
    const expected = results({
      cssGrammarVersion: () => native.cssGrammarVersion(),
      cssSyntaxStatus: (text) => native.cssSyntaxStatus(text),
      cssValueStatus: (property, value, atRule) => native.cssValueStatus(property, value, atRule),
      cssRuleDeclarationsJSON: (text) => native.cssRuleDeclarationsJson(text),
      validateCSSJSON: (text) => native.validateCssJson(text),
      parseCSSDeclarationsJSON: (text) => native.parseCssDeclarationsJson(text)
    })
    expect(expected.version).toBe(MASTER_CSS_GRAMMAR_DATA.version)
    expect(expected.syntax).toEqual(['valid', 'invalid', 'invalid'])
    expect(expected.values).toEqual(['valid', 'invalid', 'valid', 'unknown', 'valid'])
    for (const factory of [createMasterCSSToolingWasmProvider, createMasterCSSCompilerWasmProvider]) {
      const provider = await factory() as { cssGrammar: MasterCSSGrammarProvider }
      expect(results(provider.cssGrammar)).toEqual(expected)
    }
  })

  it('loads the native grammar in Node and reads declarations with UTF-16 ranges', () => {
    const grammar = cssGrammar()
    expect(grammar).toBe(cssGrammar())
    expect(grammar.binding).toBe('native')
    expect(grammar.ruleDeclarations('.é{color:red}')).toEqual([{ property: 'color', value: 'red', status: 'valid', range: { start: 3, end: 12 } }])
    expect(grammar.parseDeclarations('.a{color:red;color:blue!important}')).toEqual({ color: 'blue!important' })
    expect(grammar.validateCSS('.a{color:1px}')).toEqual([expect.objectContaining({ name: 'SyntaxMatchError', property: 'color' })])
  })

  it('needs an initialized binding in browsers, and keeps the first one registered', async () => {
    expect(() => browserCSSGrammar()).toThrow(expect.objectContaining({ code: 'NATIVE_UNAVAILABLE' }))
    const wasm = await createMasterCSSToolingWasmProvider() as { cssGrammar: MasterCSSGrammarProvider }
    registerCSSGrammar('wasm', wasm.cssGrammar)
    registerCSSGrammar('native', undefined)
    expect(browserCSSGrammar().binding).toBe('wasm')
    expect(cssGrammar().binding).toBe('wasm')
  })
})
