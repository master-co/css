import { execSync, exec } from 'child_process'
import dedent from 'dedent'
import { expectFileIncludes } from '../../../../utils/expect-file-includes'

it('init', () => {
    execSync('node ../../dist/bin/index init -o', { cwd: __dirname })
    expectFileIncludes('master.css.js', [
        dedent`
            /** @type {import('@master/css').Config} */
            const config = {
                themes: {},
                colors: {},
                classes: {},
                values: {},
                semantics: {},
                breakpoints: {},
                selectors: {},
                mediaQueries: {}
            }

            module.exports = { config }\n
        `
    ])
})

it('init --jit', () => {
    execSync('node ../../dist/bin/index init --jit -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.js', [
        dedent`
            const { MasterCSS } = require('@master/css')

            /** @type {import('@master/css').Config} */
            const config = {
                themes: {},
                colors: {},
                classes: {},
                values: {},
                semantics: {},
                breakpoints: {},
                selectors: {},
                mediaQueries: {}
            }

            const css = new MasterCSS(config)

            module.exports = { config, css }\n
        `
    ])
})

it('init --compiler', () => {
    execSync('node ../../dist/bin/index init --compiler -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.js', [
        dedent`
            /** @type {import('@master/css').Config} */
            const config = {
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
            const compilerOptions = {
                sources: [],
                classes: {
                    fixed: [],
                    ignored: []
                }
            }

            module.exports = { config, compilerOptions }\n
        `
    ])
})