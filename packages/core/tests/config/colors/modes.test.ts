import Testing from '../../cases-testing'

Testing.layers({
    'fg:primary fg:primary-10': {
        theme: '.light,:root{--primary:0 0 0}.dark{--primary:19 110 66}',
        general: '.fg\\:primary{color:rgb(var(--primary))}.fg\\:primary-10{color:rgb(238 238 238)}'
    }
}, {
    variables: {
        primary: {
            10: '#eeeeee',
            20: '#dddddd',
        }
    },
    modes: {
        light: {
            primary: '#000000'
        },
        dark: {
            primary: '#136e42'
        }
    },
    modeTrigger: 'class'
})