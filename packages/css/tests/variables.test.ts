import { initRuntime } from '../src'

const variables = {
    first: {
        '': '#111111',
        '@dark': '#222222',
        '@light': '#333333'
    },
    second: {
        '@dark': '#444444',
        '@light': '#555555'
    },
    third: {
        '': '#666666',
        '@light': '#777777'
    },
    fourth: {
        '': '#888888',
        '@dark': '#999999',
        '@light': '#000000'
    },
    fifth: {
        '@dark': '#022222',
        '@light': '#033333'
    },
    sixth: {
        '@dark': '#666666'
    }
}

beforeAll(() => {
    initRuntime({ variables })
})

it('make sure not to extend variables deeply', () => {
    expect(window.masterCSS.config.variables?.first).toEqual(variables.first)
})

it('expects the variable output', async () => {
    const p = document.createElement('p')
    p.id = 'mp'
    p.classList.add('bg:first')
    document.body.append(p)
    await new Promise(resolve => setTimeout(resolve))
    expect(window.masterCSS.text).toContain(':root{--first:17 17 17}.dark{--first:34 34 34}.light{--first:51 51 51}.bg\\:first{background-color:rgb(var(--first))}')
})

it('expects the variable output', async () => {
    const p = document.getElementById('mp')
    p?.classList.add(
        'bg:second',
        'b:third',
        '{outline:fourth;accent:fifth}',
        'fg:second',
        'accent:sixth'
    )
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    await new Promise(resolve => setTimeout(resolve, 0))
    // expect(window.masterCSS.text).toContain(':root{--first:17 17 17;--third:102 102 102;--fourth:136 136 136}.dark{--first:34 34 34;--second:68 68 68;--fourth:153 153 153;--fifth:2 34 34;--sixth:102 102 102}.light{--first:51 51 51;--second:85 85 85;--third:119 119 119;--fourth:0 0 0;--fifth:3 51 51}')
    expect(window.masterCSS.text).toMatch(/\.dark\{[^}]*--second:68 68 68[^}]*\}/)
    expect(window.masterCSS.text).toMatch(/\.light\{[^}]*--second:85 85 85[^}]*\}/)
    expect(window.masterCSS.text).toContain('.bg\\:second{background-color:rgb(var(--second))}')
    expect(window.masterCSS.text).toMatch(/\:root\{[^}]*--third:102 102 102[^}]*\}/)
    expect(window.masterCSS.text).toMatch(/\.light\{[^}]*--third:119 119 119[^}]*\}/)
    expect(window.masterCSS.text).toContain('.b\\:third{border-color:rgb(var(--third))}')
    expect(window.masterCSS.text).toMatch(/\:root\{[^}]*--fourth:136 136 136[^}]*\}/)
    expect(window.masterCSS.text).toMatch(/\.dark\{[^}]*--fourth:153 153 153[^}]*\}/)
    expect(window.masterCSS.text).toMatch(/\.light\{[^}]*--fourth:0 0 0[^}]*\}/)
    expect(window.masterCSS.text).toMatch(/\.dark\{[^}]*--fifth:2 34 34[^}]*\}/)
    expect(window.masterCSS.text).toMatch(/\.light\{[^}]*--fifth:3 51 51[^}]*\}/)
    expect(window.masterCSS.text).toContain('.\\{outline\\:fourth\\;accent\\:fifth\\}{outline-color:rgb(var(--fourth));accent-color:rgb(var(--fifth))}')
    expect(window.masterCSS.text).toContain('.fg\\:second{color:rgb(var(--second))}')
    expect(window.masterCSS.text).toMatch(/\.dark\{[^}]*--sixth:102 102 102[^}]*\}/)

    const removeClass = async (className: string) => {
        p?.classList.remove(className)
        await new Promise(resolve => setTimeout(resolve, 0))
    }
    await removeClass('bg:second')
    expect(window.masterCSS.text).toMatch(/\.dark\{[^}]*--second:68 68 68[^}]*\}/)
    expect(window.masterCSS.text).toMatch(/\.light\{[^}]*--second:85 85 85[^}]*\}/)
    await removeClass('b:third')
    expect(window.masterCSS.text).not.toMatch(/\:root\{[^}]*--third:102 102 102[^}]*\}/)
    expect(window.masterCSS.text).not.toMatch(/\.light\{[^}]*--third:119 119 119[^}]*\}/)
    await removeClass('{outline:fourth;accent:fifth}')
    expect(window.masterCSS.text).not.toMatch(/\:root\{[^}]*--fourth:136 136 136[^}]*\}/)
    expect(window.masterCSS.text).not.toMatch(/\.dark\{[^}]*--fourth:153 153 153[^}]*\}/)
    expect(window.masterCSS.text).not.toMatch(/\.light\{[^}]*--fourth:0 0 0[^}]*\}/)
    expect(window.masterCSS.text).not.toMatch(/\.dark\{[^}]*--fifth:2 34 34[^}]*\}/)
    expect(window.masterCSS.text).not.toMatch(/\.light\{[^}]*--fifth:3 51 51[^}]*\}/)
    await removeClass('fg:second')
    expect(window.masterCSS.text).not.toMatch(/\.dark\{[^}]*--second:68 68 68[^}]*\}/)
    expect(window.masterCSS.text).not.toMatch(/\.light\{[^}]*--second:85 85 85[^}]*\}/)
    await removeClass('bg:first')
    expect(window.masterCSS.text).not.toMatch(/\:root\{[^}]*--first:17 17 17[^}]*\}/)
    expect(window.masterCSS.text).not.toMatch(/\.dark\{[^}]*--first:34 34 34[^}]*\}/)
    expect(window.masterCSS.text).not.toMatch(/\.light\{[^}]*--first:51 51 51[^}]*\}/)
    await removeClass('accent:sixth')
    expect(window.masterCSS.text).toBe('')
})