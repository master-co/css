import rule from '../../src/rules/class-order'
import { RuleTester } from 'eslint'
import { resolve } from 'path'

new RuleTester({
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
    }
}).run('class order', rule, {
    valid: [],
    invalid: [
        {
            code: `
                    <div class="
                        m:8
                        bg:black
                        p:8
                        f:24
                        fg:white
                    ">
                        :)
                    </div>`,
            output: `
                    <div class="
                        bg:black
                        f:24
                        fg:white
                        m:8
                        p:8
                    ">
                        :)
                    </div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            parser: require.resolve('@angular-eslint/template-parser'),
        }
    ],
})