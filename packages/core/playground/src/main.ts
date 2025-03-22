import MasterCSS from '../../src'

console.log(new MasterCSS({
    components: {
        btn: 'block@preset'
    }
}).generate('btn')[0].text)