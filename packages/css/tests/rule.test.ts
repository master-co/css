test('declarations', () => {
    const css = new MasterCSS({
        variables: {
            primary: {
                '@light': '#fff',
                '@dark': '#000'
            }
        }
    })
    expect(css.generate('fg:primary')[0].declarations).toEqual({ color: 'rgb(var(--primary))' })
})

describe('token', () => {
    const rule = new MasterCSS().generate('b:1|solid|blue-60:hover[disabled]@sm')[0]
    test('value', () => {
        expect(rule.valueToken).toBe('1|solid|blue-60')
    })
    test('state', () => {
        expect(rule.stateToken).toBe(':hover[disabled]@sm')
    })
    test('at', () => {
        expect(rule.atToken).toBe('@sm')
    })
})

describe('value components', () => {
    test('basic', () => {
        const cls = 'font:32@sm'
        const rule = new MasterCSS().generate(cls)[0]
        expect(rule.valueComponents).toEqual([{
            text: '2rem',
            token: '32',
            type: 'number',
            value: 2,
            unit: 'rem'
        }])
        expect(rule.atToken).toBe('@sm')
    })

    test('shorthand', () => {
        expect(new MasterCSS().generate('b:1|solid|blue-60/.5')[0].valueComponents)
            .toStrictEqual([
                { token: '1', text: '0.0625rem', type: 'number', unit: 'rem', value: 0.0625 },
                { token: '|', text: ' ', type: 'separator', value: ' ' },
                { token: 'solid', text: 'solid', type: 'string', value: 'solid' },
                { token: '|', text: ' ', type: 'separator', value: ' ' },
                { token: 'blue-60/.5', alpha: '.5', name: 'blue-60', text: 'rgb(37 99 253/.5)', type: 'variable', variable: { space: 'rgb', type: 'color', value: '37 99 253' } }
            ])
    })

    test('function', () => {
        expect(new MasterCSS().generate('bg:rgb(125,125,0)!')[0].valueComponents).toStrictEqual([
            {
                type: 'function',
                name: 'rgb',
                symbol: '(',
                children: [
                    { value: '125', type: 'string', token: '125', text: '125' },
                    { type: 'separator', value: ',', text: ',', token: ',' },
                    { value: '125', type: 'string', token: '125', text: '125' },
                    { type: 'separator', value: ',', text: ',', token: ',' },
                    { value: '0', type: 'string', token: '0', text: '0' }
                ],
                token: 'rgb(125,125,0)',
                text: 'rgb(125,125,0)'
            }
        ])
    })

    test('gradient', () => {
        expect(new MasterCSS().generate('gradient(#000,#fff)')[0].valueComponents).toStrictEqual([
            {
                text: 'gradient(#000,#fff)',
                token: 'gradient(#000,#fff)',
                type: 'function',
                name: 'gradient',
                symbol: '(',
                children: [
                    { value: '#000', type: 'string', token: '#000', text: '#000' },
                    { type: 'separator', value: ',', text: ',', token: ',' },
                    { value: '#fff', type: 'string', token: '#fff', text: '#fff' }
                ]
            }
        ])
    })
})