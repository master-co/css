import config from '../../config'

test('orientation', () => {
    expect(new MasterCSS(config).add('hide@landscape').text)
        .toBe('@media (orientation:landscape){.hide\\@landscape{display:none}}')

    expect(new MasterCSS(config).add('hide@portrait').text)
        .toBe('@media (orientation:portrait){.hide\\@portrait{display:none}}')
})

test('prefers-reduced-motion', () => {
    expect(new MasterCSS(config).add('hide@motion').text)
        .toBe('@media (prefers-reduced-motion:no-preference){.hide\\@motion{display:none}}')

    expect(new MasterCSS(config).add('hide@reduced-motion').text)
        .toBe('@media (prefers-reduced-motion:reduce){.hide\\@reduced-motion{display:none}}')
})

test('mixed', () => {
    expect(new MasterCSS(config).add('hide@motion&landscape').text)
        .toBe('@media (prefers-reduced-motion:no-preference) and (orientation:landscape){.hide\\@motion\\&landscape{display:none}}')
})

test('queries', () => {
    expect(new MasterCSS(config).add('hide@watch').text)
        .toBe('@media (max-device-width:42mm) and (min-device-width:38mm){.hide\\@watch{display:none}}')

    expect(new MasterCSS(config).add('hide@device-watch').text)
        .toBe('@media (max-device-width:42mm) and (min-device-width:38mm){.hide\\@device-watch{display:none}}')

    expect(new MasterCSS(config).add('hide@device-watch').text)
        .toBe('@media (max-device-width:42mm) and (min-device-width:38mm){.hide\\@device-watch{display:none}}')

    expect(new MasterCSS(config).add('hide@supports(transform-origin:5%|5%)').text)
        .toBe('@supports (transform-origin:5% 5%){.hide\\@supports\\(transform-origin\\:5\\%\\|5\\%\\){display:none}}')

    expect(new MasterCSS(config).add('fg:black@christmas').text)
        .toBe('.christmas .fg\\:black\\@christmas{color:rgb(0 0 0)}')

    expect(new MasterCSS(config).add('fg:black@christmas@md').text)
        .toBe('@media (min-width:1024px){.christmas .fg\\:black\\@christmas\\@md{color:rgb(0 0 0)}}')
})

test('viewports', () => {
    expect(new MasterCSS(config).add('hide@tablet').text)
        .toBe('@media (min-width:768px){.hide\\@tablet{display:none}}')

    expect(new MasterCSS(config).add('hide@laptop').text)
        .toBe('@media (min-width:1024px){.hide\\@laptop{display:none}}')

    expect(new MasterCSS(config).add('hide@desktop').text)
        .toBe('@media (min-width:1280px){.hide\\@desktop{display:none}}')

    expect(new MasterCSS(config).add('hide@custom-1').text)
        .toBe('@media (min-width:2500px){.hide\\@custom-1{display:none}}')
})
