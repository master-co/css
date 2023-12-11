test('number', () => {
    expect(new MasterCSS({
        variables: {
            spacing: { x1: 16 }
        }
    }).add('m:x1').text).toBe('.m\\:x1{margin:1rem}')
})

test('number with themes', () => {
    expect(new MasterCSS({
        variables: {
            spacing: {
                x1: {
                    '': 16,
                    '@dark': 32,
                    '@light': 48
                }
            }
        }
    }).add('m:x1').text).toBe([
        ':root{--spacing-x1:16}',
        '.dark{--spacing-x1:32}',
        '.light{--spacing-x1:48}',
        '.m\\:x1{margin:calc(var(--spacing-x1) / 16 * 1rem)}'
    ].join(''))

    // 無單位屬性不需要 calc
    expect(new MasterCSS({
        variables: {
            'line-height': {
                x1: {
                    '': 16,
                    '@dark': 32,
                    '@light': 48
                }
            }
        }
    }).add('line-height:x1').text).toBe([
        ':root{--line-height-x1:16}',
        '.dark{--line-height-x1:32}',
        '.light{--line-height-x1:48}',
        '.line-height\\:x1{line-height:var(--line-height-x1)}'
    ].join(''))
})

test('number using variable function', () => {
    expect(new MasterCSS({
        variables: {
            spacing: { x1: 16 }
        }
    }).add('m:$(spacing-x1)').text).toBe('.m\\:\\$\\(spacing-x1\\){margin:1rem}')
})

test('number with themes using variable function', () => {
    expect(new MasterCSS({
        variables: {
            spacing: {
                x1: {
                    '': 16,
                    '@dark': 32,
                    '@light': 48
                }
            }
        }
    }).add('m:$(spacing-x1)').text).toBe([
        ':root{--spacing-x1:16}',
        '.dark{--spacing-x1:32}',
        '.light{--spacing-x1:48}',
        '.m\\:\\$\\(spacing-x1\\){margin:calc(var(--spacing-x1) / 16 * 1rem)}'
    ].join(''))

    // 無單位屬性不需要 calc
    expect(new MasterCSS({
        variables: {
            spacing: {
                x1: {
                    '': 16,
                    '@dark': 32,
                    '@light': 48
                }
            }
        }
    }).add('line-height:$(spacing-x1)').text).toBe([
        ':root{--spacing-x1:16}',
        '.dark{--spacing-x1:32}',
        '.light{--spacing-x1:48}',
        '.line-height\\:\\$\\(spacing-x1\\){line-height:var(--spacing-x1)}'
    ].join(''))
})

test('variables', () => {
    expect(new MasterCSS({
        variables: {
            spacing: { x1: 16, x2: 32 },
        }
    }).create('m:$(spacing-x1)')?.text).toBe('.m\\:\\$\\(spacing-x1\\){margin:1rem}')
})

test('negative variables', () => {
    expect(new MasterCSS({
        variables: {
            spacing: { x1: 16, x2: 32 }
        }
    }).create('m:$(-spacing-x1)')?.text).toBe('.m\\:\\$\\(-spacing-x1\\){margin:-1rem}')

    expect(new MasterCSS({
        variables: {
            width: { '11x': 60 }
        }
    }).add('w:-11x').text).toBe('.w\\:-11x{width:-3.75rem}')
})