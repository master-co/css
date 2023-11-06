import { testCSS, testProp } from '../../css'

test('number', () => {
    testProp('m:x1', 'margin:1rem', {
        variables: {
            spacing: { x1: 16 }
        }
    })
})

test('number with themes', () => {
    testCSS('m:x1', [
        ':root{--spacing-x1:16}',
        '.dark{--spacing-x1:32}',
        '.light{--spacing-x1:48}',
        '.m\\:x1{margin:calc(var(--spacing-x1) / 16 * 1rem)}'
    ].join(''), {
        variables: {
            spacing: {
                x1: {
                    '': 16,
                    '@dark': 32,
                    '@light': 48
                }
            }
        }
    })

    // 無單位屬性不需要 calc
    testCSS('line-height:x1', [
        ':root{--lineHeight-x1:16}',
        '.dark{--lineHeight-x1:32}',
        '.light{--lineHeight-x1:48}',
        '.line-height\\:x1{line-height:var(--lineHeight-x1)}'
    ].join(''), {
        variables: {
            lineHeight: {
                x1: {
                    '': 16,
                    '@dark': 32,
                    '@light': 48
                }
            }
        }
    })
})

test('number using variable function', () => {
    testProp('m:$(spacing-x1)', 'margin:1rem', {
        variables: {
            spacing: { x1: 16 }
        }
    })
})

test('number with themes using variable function', () => {
    testCSS('m:$(spacing-x1)', [
        ':root{--spacing-x1:16}',
        '.dark{--spacing-x1:32}',
        '.light{--spacing-x1:48}',
        '.m\\:\\$\\(spacing-x1\\){margin:calc(var(--spacing-x1) / 16 * 1rem)}'
    ].join(''), {
        variables: {
            spacing: {
                x1: {
                    '': 16,
                    '@dark': 32,
                    '@light': 48
                }
            }
        }
    })

    // 無單位屬性不需要 calc
    testCSS('line-height:$(spacing-x1)', [
        ':root{--spacing-x1:16}',
        '.dark{--spacing-x1:32}',
        '.light{--spacing-x1:48}',
        '.line-height\\:\\$\\(spacing-x1\\){line-height:var(--spacing-x1)}'
    ].join(''), {
        variables: {
            spacing: {
                x1: {
                    '': 16,
                    '@dark': 32,
                    '@light': 48
                }
            }
        }
    })
})

test('variables', () => {
    testCSS('m:$(spacing-x1)', '.m\\:\\$\\(spacing-x1\\){margin:1rem}', {
        variables: {
            spacing: { x1: 16, x2: 32 },
        }
    })
})

test('negative variables', () => {
    testCSS('m:$(-spacing-x1)', '.m\\:\\$\\(-spacing-x1\\){margin:-1rem}', {
        variables: {
            spacing: { x1: 16, x2: 32 }
        }
    })

    testCSS('w:-11x', '.w\\:-11x{width:-3.75rem}', {
        variables: {
            width: { '11x': 60 }
        }
    })
})