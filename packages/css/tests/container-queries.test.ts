import config from './config'

test('container queries', () => {
    expect(new MasterCSS(config).add('font:32@container(min-width:800px)').text)
        .toBe('@container (min-width:800px){.font\\:32\\@container\\(min-width\\:800px\\){font-size:2rem}}')
})
