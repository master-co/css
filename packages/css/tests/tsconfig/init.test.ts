import { execSync } from 'child_process'
import dedent from 'ts-dedent'
import { expectFileIncludes } from '../../../../utils/expect-file-includes'

it('init (with tsconfig.json)', () => {
    execSync('node ../../dist/cjs/bin init -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.ts', [
        dedent`
            import { Config } from '@master/css'

            export const config: Config = {
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

it('init --jit (with tsconfig.json)', () => {
    execSync('node ../../dist/cjs/bin init --jit -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.ts', [
        dedent`
            import MasterCSS, { Config } from '@master/css'

            export const config: Config = {
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

it('init --compiler (with tsconfig.json)', () => {
    execSync('node ../../dist/cjs/bin init --compiler -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.ts', [
        dedent`
            import { Config } from '@master/css'
            import { Options } from '@master/css-compiler'

            export const config: Config = {
                themes: {},
                colors: {},
                classes: {},
                values: {},
                semantics: {},
                breakpoints: {},
                selectors: {},
                mediaQueries: {}
            }

            export const compilerOptions: Options = {
                sources: [],
                classes: {
                    fixed: [],
                    ignored: []
                }
            }\n
        `
    ])
})

it('init --jit --compiler (with tsconfig.json)', () => {
    execSync('node ../../dist/cjs/bin init --jit --compiler -o', { cwd: __dirname }).toString()
    expectFileIncludes('master.css.ts', [
        dedent`
            import MasterCSS, { Config } from '@master/css'
            import { Options } from '@master/css-compiler'

            export const config: Config = {
                themes: {},
                colors: {},
                classes: {},
                values: {},
                semantics: {},
                breakpoints: {},
                selectors: {},
                mediaQueries: {}
            }

            export const compilerOptions: Options = {
                sources: [],
                classes: {
                    fixed: [],
                    ignored: []
                }
            }

            export const css = new MasterCSS(config)\n
        `
    ])
})