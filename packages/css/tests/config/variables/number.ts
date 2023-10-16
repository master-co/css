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
        ':root{--x1:16}',
        '.dark{--x1:32}',
        '.light{--x1:48}',
        '.m\\:x1{margin:calc(var(--x1)/16*1rem)}'
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
        ':root{--x1:16}',
        '.dark{--x1:32}',
        '.light{--x1:48}',
        '.line-height\\:x1{line-height:var(--x1)}'
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

test('number using variable function', () => {
    testProp('m:$(spacing.x1)', 'margin:1rem', {
        variables: {
            spacing: { x1: 16 }
        }
    })
})

test('number with themes using variable function', () => {
    testCSS('m:$(spacing.x1)', [
        ':root{--x1:16}',
        '.dark{--x1:32}',
        '.light{--x1:48}',
        '.m\\:\\$\\(spacing\\.x1\\){margin:calc(var(--x1)/16*1rem)}'
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
    testCSS('line-height:$(spacing.x1)', [
        ':root{--x1:16}',
        '.dark{--x1:32}',
        '.light{--x1:48}',
        '.line-height\\:\\$\\(spacing\\.x1\\){line-height:var(--x1)}'
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
