import { testCSS } from './css'
import config from './config'

test('values', () => {
    testCSS(
        'w:2-x',
        '.w\\:2-x{width:2rem}',
        config
    )
    testCSS(
        'w:3x',
        '.w\\:3x{width:3rem}',
        config
    )
    testCSS(
        'w:x-1-2',
        '.w\\:x-1-2{width:50rem}',
        config
    )
    testCSS(
        'w:x-2',
        '.w\\:x-2{width:100rem}',
        config
    )
    testCSS(
        'font:sm',
        '.font\\:sm{font-size:1rem}',
        config
    )
    testCSS(
        'font-size:sm',
        '.font-size\\:sm{font-size:1rem}',
        config
    )
    testCSS(
        'ls:wide',
        '.ls\\:wide{letter-spacing:0.025em}',
        config
    )
    testCSS(
        'letter-spacing:wide',
        '.letter-spacing\\:wide{letter-spacing:0.025em}',
        config
    )
    testCSS(
        'shadow:2x',
        '.shadow\\:2x{box-shadow:0rem 25px 50px -12px rgb(0 0 0 / 25%)}',
        config
    )
    testCSS(
        'inset:sm|md|md|sm',
        '.inset\\:sm\\|md\\|md\\|sm{inset:0.625rem 1.25rem 1.25rem 0.625rem}',
        config
    )
    testCSS(
        'content:delimiter',
        '.content\\:delimiter{content:"123"}',
        {
            rules: {
                content: {
                    values: {
                        delimiter: '"123"'
                    }
                }
            }
        }
    )
    testCSS(
        'content:delimiter',
        '.content\\:delimiter{content:"|"}',
        {
            rules: {
                content: {
                    values: {
                        delimiter: '"|"'
                    }
                }
            }
        }
    )
    testCSS(
        'b:input',
        '.b\\:input{border:0.0625rem solid #000}',
        {
            colors: {
                base: {
                    70: '#000'
                }
            },
            rules: {
                border: {
                    values: {
                        input: '1|solid|base-70'
                    }
                }
            }
        }
    )
    testCSS(
        'b:inputborder',
        '.b\\:inputborder{border:0.125rem solid #d11a1e}',
        config
    )
    testCSS(
        'w:calc(-2+1x)',
        '.w\\:calc\\(-2\\+1x\\){width:calc(-0.125rem + 3.75rem)}',
        {
            values: {
                '1x': 60
            }
        }
    )
    testCSS(
        'w:calc(-2-1x)',
        '.w\\:calc\\(-2-1x\\){width:calc(-0.125rem - 3.75rem)}',
        {
            values: {
                '1x': 60
            }
        }
    )
    testCSS(
        'w:calc(-1x-2)',
        '.w\\:calc\\(-1x-2\\){width:calc(-3.75rem - 0.125rem)}',
        {
            values: {
                '1x': 60
            }
        }
    )
    testCSS(
        'w:-11x',
        '.w\\:-11x{width:-3.75rem}',
        {
            values: {
                '11x': 60
            }
        }
    )
})
