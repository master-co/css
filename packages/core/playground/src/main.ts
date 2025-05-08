import { createCSS } from '../../src'

console.log(createCSS({
    components: {
        btn: 'block@preset'
    }
}).generate('btn')[0].text)