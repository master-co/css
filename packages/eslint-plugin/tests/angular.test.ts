import rule from '../src/rules/class-order'
import { jsxTester } from './testers'

jsxTester.run('class order', rule, {
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
                        m:8
                        p:8
                        bg:black
                        f:24
                        fg:white
                    ">
                        :)
                    </div>`,
            errors: [{ messageId: 'invalidClassOrder' }],
            languageOptions: {
                parser: await import('@angular-eslint/template-parser')
            }
        }
    ],
})