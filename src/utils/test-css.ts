import { StyleSheet } from '../../src';
import { render } from '../../src/render';

export const css = (cls: string): string => {
    return render(`<html class="${cls}">`, { StyleSheet }).css
}

export const testCSS = (cls: string, expected: string): void => {
    expect(css(cls)).toBe(expected)
}

// test class and prop, if expected === undefinded, will use cls as expected value
// examples:
// testProp("z-index:1") // equals to testCSS("z-index:1", ".z-index\\:1{z-index:1}")
// testProp("z-index:1") // equals to testProp("z-index:1", "z-index:1")
export const testProp = (cls: string, expected?: string): void => {
    const selector = CSS.escape(cls)
    if (expected === undefined) {
        expected = cls
    }
    expect(css(cls)).toBe(`.${selector}{${expected}}`)
}
