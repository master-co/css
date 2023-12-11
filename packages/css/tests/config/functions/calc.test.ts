it('calc', () => {
    expect(new MasterCSS().create('line-height:calc(32-16)')?.text).toBe('.line-height\\:calc\\(32-16\\){line-height:calc(32 - 16)}')
    expect(new MasterCSS().create('font-size:calc(32-16)')?.text).toBe('.font-size\\:calc\\(32-16\\){font-size:calc(2rem - 1rem)}')
    expect(new MasterCSS().create('mt:calc(var(--g-y)*-.1)')?.text).toBe('.mt\\:calc\\(var\\(--g-y\\)\\*-\\.1\\){margin-top:calc(var(--g-y) * -0.1 / 16 * 1rem)}')
    expect(new MasterCSS().create('mt:calc(var(--g-y)*(-.1))')?.text).toBe('.mt\\:calc\\(var\\(--g-y\\)\\*\\(-\\.1\\)\\){margin-top:calc(var(--g-y) * (-0.1) / 16 * 1rem)}')
    expect(new MasterCSS().create('mt:calc(var(--g-y)--.1)')?.text).toBe('.mt\\:calc\\(var\\(--g-y\\)--\\.1\\){margin-top:calc(var(--g-y) / 16 * 1rem - -0.00625rem)}')
    expect(new MasterCSS().create('mr:calc(var(--g-x)/(-2))')?.text).toBe('.mr\\:calc\\(var\\(--g-x\\)\\/\\(-2\\)\\){margin-right:calc(var(--g-x) / (-2) / 16 * 1rem)}')
})

it('calc with variables', () => {
    expect(new MasterCSS({
        variables: { x1: 60 }
    }).create('w:calc(-2+$(x1))')?.text).toBe('.w\\:calc\\(-2\\+\\$\\(x1\\)\\){width:calc(-0.125rem + 60 / 16 * 1rem)}')
    expect(new MasterCSS({
        variables: { '1x': 60 }
    }).create('w:calc(-2-$(1x))')?.text).toBe('.w\\:calc\\(-2-\\$\\(1x\\)\\){width:calc(-0.125rem - 60 / 16 * 1rem)}')
    expect(new MasterCSS({
        variables: { '1x': 60 }
    }).create('w:calc(-$(1x)-2)')?.text).toBe('.w\\:calc\\(-\\$\\(1x\\)-2\\){width:calc(-60 / 16 * 1rem - 0.125rem)}')
    expect(new MasterCSS({
        variables: { '1x': 60 }
    }).create('w:calc(-1*($(1x)*2)*3-2)')?.text).toBe('.w\\:calc\\(-1\\*\\(\\$\\(1x\\)\\*2\\)\\*3-2\\){width:calc(-1 * (60 * 2) * 3 / 16 * 1rem - 0.125rem)}')
})