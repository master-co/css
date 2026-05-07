import { createCSS } from '../../src'

console.log(createCSS({
    components: {
        btn: [
            { selector: '&', atRules: ['@layer preset'], declarations: { display: 'block' } }
        ]
    }
}).generate('btn')[0].text)
