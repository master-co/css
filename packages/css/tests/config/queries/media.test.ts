import config from '../../config'

test('orientation', () => {
    expect(new MasterCSS(config).add('hidden@landscape').text)
        .toBe('@media (orientation:landscape){.hidden\\@landscape{display:none}}')

    expect(new MasterCSS(config).add('hidden@portrait').text)
        .toBe('@media (orientation:portrait){.hidden\\@portrait{display:none}}')
})

test('prefers-reduced-motion', () => {
    expect(new MasterCSS(config).add('hidden@motion').text)
        .toBe('@media (prefers-reduced-motion:no-preference){.hidden\\@motion{display:none}}')

    expect(new MasterCSS(config).add('hidden@reduced-motion').text)
        .toBe('@media (prefers-reduced-motion:reduce){.hidden\\@reduced-motion{display:none}}')
})

test('mixed', () => {
    expect(new MasterCSS(config).add('hidden@motion&landscape').text)
        .toBe('@media (prefers-reduced-motion:no-preference) and (orientation:landscape){.hidden\\@motion\\&landscape{display:none}}')
})

test('queries', () => {
    expect(new MasterCSS(config).add('hidden@watch').text)
        .toBe('@media (max-device-width:42mm) and (min-device-width:38mm){.hidden\\@watch{display:none}}')

    expect(new MasterCSS(config).add('hidden@device-watch').text)
        .toBe('@media (max-device-width:42mm) and (min-device-width:38mm){.hidden\\@device-watch{display:none}}')

    expect(new MasterCSS(config).add('hidden@device-watch').text)
        .toBe('@media (max-device-width:42mm) and (min-device-width:38mm){.hidden\\@device-watch{display:none}}')

    expect(new MasterCSS(config).add('hidden@supports(transform-origin:5%|5%)').text)
        .toBe('@supports (transform-origin:5% 5%){.hidden\\@supports\\(transform-origin\\:5\\%\\|5\\%\\){display:none}}')

    expect(new MasterCSS(config).add('fg:black@christmas').text)
        .toBe('.christmas .fg\\:black\\@christmas{color:rgb(0 0 0)}')

    expect(new MasterCSS(config).add('fg:black@christmas@md').text)
        .toBe('@media (min-width:1024px){.christmas .fg\\:black\\@christmas\\@md{color:rgb(0 0 0)}}')
})

test('viewports', () => {
    expect(new MasterCSS(config).add('hidden@tablet').text)
        .toBe('@media (min-width:768px){.hidden\\@tablet{display:none}}')

    expect(new MasterCSS(config).add('hidden@laptop').text)
        .toBe('@media (min-width:1024px){.hidden\\@laptop{display:none}}')

    expect(new MasterCSS(config).add('hidden@desktop').text)
        .toBe('@media (min-width:1280px){.hidden\\@desktop{display:none}}')

    expect(new MasterCSS(config).add('hidden@custom-1').text)
        .toBe('@media (min-width:2500px){.hidden\\@custom-1{display:none}}')
})
