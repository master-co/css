import { expect, test } from 'vitest'
import { addLitShadowRuntime, addLitShadowStylesheet } from '../src/transforms'

for (const ownStyles of ['', 'static styles = ["existing"]', 'static get styles() { return ["existing"] }']) {
  test(`static shadow setup preserves ${ownStyles || 'empty styles'} and is idempotent`, () => {
    const source = `export class Element extends LitElement { ${ownStyles} }`
    const output = addLitShadowStylesheet(source)
    expect(output).not.toContain('@master/css-runtime')
    expect(addLitShadowStylesheet(output)).toBe(output)
    const executable = output.replace(/^import.*$/gm, '').replace('export class', 'return class')
    const element = Function('LitElement', 'unsafeCSS', 'masterCSSStyles', executable)(Object, (css: string) => css, 'generated')
    expect(element.styles.flat()).toEqual(ownStyles ? ['generated', 'existing'] : ['generated'])
  })
}

test('explicit runtime setup retains the shadow runtime decorator', () => {
  expect(addLitShadowRuntime('export class Element extends LitElement {}')).toContain('@withMasterCSSRuntime({ manifest, emittedGlobals })')
})
