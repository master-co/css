import { testCSS } from '../../css'
import config from '../../config'

it('uses with $ function', () => {
    testCSS('font-weight:$(font-weight/thin)', '.font-weight\\:\\$\\(font-weight\\/thin\\){font-weight:100}')
})

it('access colors using $ function', () => {
    testCSS('fg:$(blue-50)', '.fg\\:\\$\\(blue-50\\){color:#175fe9}')
})

test('variables', () => {
    testCSS('m:$(spacing/x1)', '.m\\:\\$\\(spacing\\/x1\\){margin:1rem}', {
        variables: {
            spacing: { x1: 16, x2: 32 }
        }
    })
})

test('negative variables', () => {
    testCSS('m:$(-spacing/x1)', '.m\\:\\$\\(-spacing\\/x1\\){margin:-1rem}', {
        variables: {
            spacing: { x1: 16, x2: 32 }
        }
    })
})

test('rule variables', () => {
    testCSS('font:sm', '.font\\:sm{font-size:1rem}', config)
    testCSS('font-size:sm', '.font-size\\:sm{font-size:1rem}', config)
    testCSS('ls:wide', '.ls\\:wide{letter-spacing:0.025em}', config)
    testCSS('letter-spacing:wide', '.letter-spacing\\:wide{letter-spacing:0.025em}', config)
    testCSS('shadow:2x', '.shadow\\:2x{box-shadow:0rem 25px 50px -12px rgb(0 0 0 / 25%)}', config)
    testCSS('inset:sm|md|md|sm', '.inset\\:sm\\|md\\|md\\|sm{inset:0.625rem 1.25rem 1.25rem 0.625rem}', config)
    testCSS('b:inputborder', '.b\\:inputborder{border:0.125rem solid #d11a1e}', config)
    testCSS('content:delimiter', '.content\\:delimiter{content:"123"}', {
        rules: {
            content: {
                variables: { delimiter: '"123"' }
            }
        }
    })
    testCSS('content:delimiter', '.content\\:delimiter{content:"|"}', {
        rules: {
            content: {
                variables: { delimiter: '"|"' }
            }
        }
    })
    testCSS('b:input', '.b\\:input{border:0.0625rem solid #000}', {
        colors: { test: { 70: '#000' } },
        rules: {
            border: {
                variables: {
                    input: '1|solid|test-70'
                }
            }
        }
    })
})

it('negative variables', () => {
    testCSS('w:-11x', '.w\\:-11x{width:-3.75rem}', {
        rules: {
            width: {
                variables: { '11x': 60 }
            }
        }
    })
})