import type { MatcherFunction } from 'expect'
import { MasterCSS } from '../core'
import type { Config } from '../config'
// @ts-ignore
import matchers from 'expect/build/matchers'

const toBeMasterCSSRule: MatcherFunction<[expected: string, config?: Config]> =
    function (actual, expected, config) {
        if (typeof actual !== 'string') {
            throw new Error('It must be of type string.')
        }
        const css = new MasterCSS(config)
        css.add(actual)
        return matchers.toBe.call(this, css.text, expected)
    }

export default toBeMasterCSSRule

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace jest {
        interface Matchers<R> {
            toBeMasterCSSRule(expected: string, config?: Config): R;
        }
    }
}