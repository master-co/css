import 'css-shared/test/matchMedia.mock'
import '../src/polyfills/css-escape'
import { Config, MasterCSS } from '../src'

export const testCSS = (syntax: string, expected: string | string[], config?: Config): void => {
    const css = new MasterCSS(config)
    css.add(syntax)
    if (Array.isArray(expected)) {
        expected = expected.join('')
    }
    expect(css.text).toBe(expected)
}

// test class and prop, if expected === undefinded, will use syntax as expected value
// examples:
// testProp("z-index:1") // equals to testCSS("z-index:1", ".z-index\\:1{z-index:1}")
// testProp("z-index:1") // equals to testProp("z-index:1", "z-index:1")
export const testProp = (classes: string | string[], expected: string, config?: Config): void => {
    if (typeof classes === 'string') {
        classes = [classes]
    }
    classes.forEach((eachClassName) => {
        const selector = CSS.escape(eachClassName)
        const css = new MasterCSS(config)
        css.add(eachClassName)
        expect(css.text).toBe(`.${selector}{${expected}}`)
    })
}

export const expectOrderOfRules = (classNames: string[], expected: string[]): void => {
    const css = new MasterCSS()
    classNames.forEach((eachClassName) => {
        css.add(eachClassName)
    })
    const sortedClassNames = css.rules.map((rule) => rule.className)
    expect(sortedClassNames).toEqual(expected)
}