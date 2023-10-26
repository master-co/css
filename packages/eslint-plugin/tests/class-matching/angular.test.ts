import rule from '../../src/rules/class-order'
import { RuleTester } from 'eslint'

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
                        fg:white
                        f:24
                    ">
                        :)
                    </div>`,
            output: `
                    <div class="
                        bg:black
                        fg:white
                        f:24
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