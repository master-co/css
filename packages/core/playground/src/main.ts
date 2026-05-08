import { createCSS } from '../../src'

console.log(createCSS({
    utilities: [
        {
            name: 'btn',
            type: -4,
            layer: 'main',
            rules: [
                { selector: '&', atRules: ['@layer preset'], declarations: { display: 'block' } }
            ]
        }
    ]
}).generate('btn')[0].text)
