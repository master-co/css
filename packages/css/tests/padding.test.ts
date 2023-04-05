import '../src/polyfills/css-escape'
import { MasterCSS, render } from '../src'

it('checks padding order', () => {
    const css = new MasterCSS({ observe: false });
    ['px:0', 'pl:0', 'pr:0', 'p:0', 'pt:0', 'pb:0', 'py:0'].forEach((eachClassName) => {
        css.insert(eachClassName)
    })
    const sortedClassNames = css.rules.map((rule) => rule.className)
    expect(sortedClassNames[0]).toBe('p:0')
    expect(sortedClassNames[1]).toBe('py:0') // or px:0

})