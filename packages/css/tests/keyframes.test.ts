import { initRuntime } from '../src'

beforeAll(() => {
    initRuntime({ animations: { fade: {} } })
})

it('make sure not to extend animations deeply', () => {
    const fade = window.masterCSS.config.animations?.fade
    expect(fade).toEqual({})
})

it('expects the animation output', async () => {
    window.masterCSS.refresh({})
    const p = document.createElement('p')
    p.id = 'mp'
    p.classList.add('@fade|1s')
    document.body.append(p)
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).toContain('.\\@fade\\|1s{animation:fade 1s}')
})

it('expects the keyframe output', async () => {
    const p = document.getElementById('mp')
    p?.classList.add(
        '@flash|1s',
        '@float|1s',
        '@heart|1s',
        '@jump|1s',
        '@ping|1s',
        '@pulse|1s',
        '@rotate|1s',
        '@shake|1s',
        '@zoom|1s',
        '{@zoom|1s;f:16}'
    )
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).toContain('@keyframes fade{0%{opacity:0}to{opacity:1}}')
    expect(window.masterCSS.text).toContain('@keyframes flash{0%,50%,to{opacity:1}25%,75%{opacity:0}}')
    expect(window.masterCSS.text).toContain('@keyframes float{0%{transform:none}50%{transform:translateY(-1.25rem)}to{transform:none}}')
    expect(window.masterCSS.text).toContain('@keyframes heart{0%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.3)}70%{transform:scale(1)}}')
    expect(window.masterCSS.text).toContain('@keyframes jump{0%,to{transform:translateY(-25%);animation-timing-function:cubic-bezier(.8,0,1,1)}50%{transform:translateY(0);animation-timing-function:cubic-bezier(0,0,.2,1)}}')
    expect(window.masterCSS.text).toContain('@keyframes ping{75%,to{transform:scale(2);opacity:0}}')
    expect(window.masterCSS.text).toContain('@keyframes pulse{0%{transform:none}50%{transform:scale(1.05)}to{transform:none}}')
    expect(window.masterCSS.text).toContain('@keyframes rotate{0%{transform:rotate(-360deg)}to{transform:none}}')
    expect(window.masterCSS.text).toContain('@keyframes shake{0%{transform:none}6.5%{transform:translateX(-6px) rotateY(-9deg)}18.5%{transform:translateX(5px) rotateY(7deg)}31.5%{transform:translateX(-3px) rotateY(-5deg)}43.5%{transform:translateX(2px) rotateY(3deg)}50%{transform:none}}')
    expect(window.masterCSS.text).toContain('@keyframes zoom{0%{transform:scale(0)}to{transform:none}}')
    p?.classList.remove('@fade|1s')
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).not.toContain('@keyframes fade{0%{opacity:0}to{opacity:1}}')
    p?.classList.remove('@flash|1s')
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).not.toContain('@keyframes flash{0%,50%,to{opacity:1}25%,75%{opacity:0}}')
    p?.classList.remove('@float|1s')
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).not.toContain('@keyframes float{0%{transform:none}50%{transform:translateY(-1.25rem)}to{transform:none}}')
    p?.classList.remove('@heart|1s')
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).not.toContain('@keyframes heart{0%{transform:scale(1)}14%{transform:scale(1.3)}28%{transform:scale(1)}42%{transform:scale(1.3)}70%{transform:scale(1)}}')
    p?.classList.remove('@jump|1s')
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).not.toContain('@keyframes jump{0%,to{transform:translateY(-25%);animation-timing-function:cubic-bezier(.8,0,1,1)}50%{transform:translateY(0);animation-timing-function:cubic-bezier(0,0,.2,1)}}')
    p?.classList.remove('@ping|1s')
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).not.toContain('@keyframes ping{75%,to{transform:scale(2);opacity:0}}')
    p?.classList.remove('@pulse|1s')
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).not.toContain('@keyframes pulse{0%{transform:none}50%{transform:scale(1.05)}to{transform:none}}')
    p?.classList.remove('@rotate|1s')
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).not.toContain('@keyframes rotate{0%{transform:rotate(-360deg)}to{transform:none}}')
    p?.classList.remove('@shake|1s')
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).not.toContain('@keyframes shake{0%{transform:none}6.5%{transform:translateX(-6px) rotateY(-9deg)}18.5%{transform:translateX(5px) rotateY(7deg)}31.5%{transform:translateX(-3px) rotateY(-5deg)}43.5%{transform:translateX(2px) rotateY(3deg)}50%{transform:none}}')
    p?.classList.remove('@zoom|1s')
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).toContain('@keyframes zoom{0%{transform:scale(0)}to{transform:none}}')
    p?.classList.remove('{@zoom|1s;f:16}')
    await new Promise(resolve => setTimeout(resolve, 100))
    expect(window.masterCSS.text).not.toContain('@keyframes zoom{0%{transform:scale(0)}to{transform:none}}')
})