import { execSync } from 'child_process'
import dedent from 'dedent'

it('init (with type="module")', () => {
    const defintion = execSync('node ../../dist/bin/index init', { cwd: __dirname }).toString()
    expect(defintion).toEqual(dedent`
        /** @type {import('@master/css').Config} */
        export const config = {
            themes: {},
            colors: {},
            classes: {},
            values: {},
            semantics: {},
            breakpoints: {},
            selectors: {},
            mediaQueries: {}
        }\n
    `)
})

it('init --jit (with type="module")', () => {
    const defintion = execSync('node ../../dist/bin/index init --jit', { cwd: __dirname }).toString()
    expect(defintion).toEqual(dedent`
        import MasterCSS from '@master/css'

        /** @type {import('@master/css').Config} */
        export const config = {
            themes: {},
            colors: {},
            classes: {},
            values: {},
            semantics: {},
            breakpoints: {},
            selectors: {},
            mediaQueries: {}
        }

        export const css = new MasterCSS(config)\n
    `)
})

it('init --compiler (with type="module")', () => {
    const defintion = execSync('node ../../dist/bin/index init --compiler', { cwd: __dirname }).toString()
    expect(defintion).toEqual(dedent`
        /** @type {import('@master/css').Config} */
        export const config = {
            themes: {},
            colors: {},
            classes: {},
            values: {},
            semantics: {},
            breakpoints: {},
            selectors: {},
            mediaQueries: {}
        }

        /** @type {import('@master/css-compiler').Options} */
        export const compilerOptions = {
            sources: [],
            classes: {
                fixed: [],
                ignored: []
            }
        }\n
    `)
})