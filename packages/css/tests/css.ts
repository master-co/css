import 'shared/test/matchMedia.mock'
import '../src/polyfills/css-escape'
import { Config, MasterCSS, generateFromClasses } from '../src'

export const testCSS = (syntax: string, expected: string, config?: Config): void => {
    expect(generateFromClasses([syntax], config)).toBe(expected)
}

// test class and prop, if expected === undefinded, will use syntax as expected value
// examples:
// testProp("z-index:1") // equals to testCSS("z-index:1", ".z-index\\:1{z-index:1}")
// testProp("z-index:1") // equals to testProp("z-index:1", "z-index:1")
export const testProp = (className: string | string[], expected?: string): void => {
    if (typeof className === 'string') {
        className = [className]
    }
    className.forEach((eachClassName) => {
        const selector = CSS.escape(eachClassName)
        if (expected === undefined) {
            expected = eachClassName
        }
        expect(generateFromClasses([eachClassName])).toBe(`.${selector}{${expected}}`)
    })
}

export const expectOrderOfRules = (classNames: string[], expected: string[]): void => {
    const css = new MasterCSS({ observe: false })
    classNames.forEach((eachClassName) => {
        css.insert(eachClassName)
    })
    const sortedClassNames = css.rules.map((rule) => rule.className)
    expect(sortedClassNames).toEqual(expected)
}