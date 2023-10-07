import { testCSS } from './css'
import config from './config'

test('semantics', () => {
    testCSS('show', '.show{display:block}', config)
    testCSS('gradient-text', '.gradient-text{-webkit-text-fill-color:transparent;-webkit-background-clip:text;background-clip:text}')
    testCSS('@my-animation', '@keyframes rotate{0%{transform:rotate(-360deg)}to{transform:none}}.\\@my-animation{animation:1s linear infinite rotate}', {
        semantics: {
            '@my-animation': {
                animation: '1s linear infinite rotate'
            }
        }
    }
    )
    testCSS('hide-text', '.hide-text{font-size:0px}', config)
    testCSS('zero', '.zero{font-size:0px;height:0px}', config)
    testCSS('full', '.full{width:100%;height:100%}')
})
