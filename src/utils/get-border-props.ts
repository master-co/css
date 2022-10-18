const BORDER_DASH = 'border-'

export function getBorderProps(name: string, declaration, suffix = '') {
    if (suffix) {
        suffix = '-' + suffix
    }
    const direction = /^b(order)?-?(.)?/.exec(name)[2]
    const BORDER_LEFT = BORDER_DASH + 'left' + suffix
    const BORDER_RIGHT = BORDER_DASH + 'right' + suffix
    const BORDER_TOP = BORDER_DASH + 'top' + suffix
    const BORDER_BOTTOM = BORDER_DASH + 'bottom' + suffix
    switch (direction) {
    case 'x':
        return {
            [BORDER_LEFT]: declaration,
            [BORDER_RIGHT]: declaration
        }
    case 'y':
        return {
            [BORDER_TOP]: declaration,
            [BORDER_BOTTOM]: declaration
        }
    case 'l':
        return {
            [BORDER_LEFT]: declaration
        }
    case 'r':
        return {
            [BORDER_RIGHT]: declaration
        }
    case 't':
        return {
            [BORDER_TOP]: declaration
        }
    case 'b':
        return {
            [BORDER_BOTTOM]: declaration
        }
    default:
        return {
            ['border' + suffix]: declaration
        }
    }
}