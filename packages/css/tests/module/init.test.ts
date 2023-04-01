import { execSync } from 'child_process'
import dedent from 'dedent'
import { expectFileIncludes } from '../../../../utils/expect-file-includes'

it('init (with type="module")', () => {
    execSync('node ../../dist/cjs/bin init -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.mjs', [
        dedent`
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
        `
    ])
})

it('init --jit (with type="module")', () => {
    execSync('node ../../dist/cjs/bin init --jit -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.mjs', [
        dedent`
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
        `
    ])
})

it('init --compiler (with type="module")', () => {
    execSync('node ../../dist/cjs/bin init --compiler -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.mjs', [
        dedent`
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
        `
    ])
})