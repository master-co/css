import { testCSS } from '../../css'

it('calc', () => {
    testCSS('line-height:calc(32-16)', '.line-height\\:calc\\(32-16\\){line-height:calc(32 - 16)}')
    testCSS('font-size:calc(32-16)', '.font-size\\:calc\\(32-16\\){font-size:calc(2rem - 1rem)}')
    testCSS('mt:calc(var(--g-y)*-.1)', '.mt\\:calc\\(var\\(--g-y\\)\\*-\\.1\\){margin-top:calc(var(--g-y) * -0.1 / 16 * 1rem)}')
    testCSS('mt:calc(var(--g-y)*(-.1))', '.mt\\:calc\\(var\\(--g-y\\)\\*\\(-\\.1\\)\\){margin-top:calc(var(--g-y) * (-0.1) / 16 * 1rem)}')
    testCSS('mt:calc(var(--g-y)--.1)', '.mt\\:calc\\(var\\(--g-y\\)--\\.1\\){margin-top:calc(var(--g-y) / 16 * 1rem - -0.00625rem)}')
    testCSS('mr:calc(var(--g-x)/(-2))', '.mr\\:calc\\(var\\(--g-x\\)\\/\\(-2\\)\\){margin-right:calc(var(--g-x) / (-2) / 16 * 1rem)}')
})

it('calc with variables', () => {
    testCSS('w:calc(-2+$(x1))', '.w\\:calc\\(-2\\+\\$\\(x1\\)\\){width:calc(-0.125rem + 60 / 16 * 1rem)}', {
        variables: { x1: 60 }
    })
    testCSS('w:calc(-2-$(1x))', '.w\\:calc\\(-2-\\$\\(1x\\)\\){width:calc(-0.125rem - 60 / 16 * 1rem)}', {
        variables: { '1x': 60 }
    })
    testCSS('w:calc(-$(1x)-2)', '.w\\:calc\\(-\\$\\(1x\\)-2\\){width:calc(-60 / 16 * 1rem - 0.125rem)}', {
        variables: { '1x': 60 }
    })
     testCSS('w:calc(-1*($(1x)*2)*3-2)', '.w\\:calc\\(-1\\*\\(\\$\\(1x\\)\\*2\\)\\*3-2\\){width:calc(-1 * (60 * 2) * 3 / 16 * 1rem - 0.125rem)}', {
        variables: { '1x': 60 }
    })
})