import benchmark from 'css-shared/test/benchmark'

benchmark('styles', {
    'empty': () => { new MasterCSS() },
    'flat': () => {
        new MasterCSS({
            styles: {
                btn: { '': 'inline-block px:2x', primary: 'inline-block px:2x' }
            }
        })
    },
    'link': () => {
        new MasterCSS({
            styles: {
                btn: { '': 'inline-block px:2x', primary: 'btn' }
            }
        })
    }
}, { time: 10 })