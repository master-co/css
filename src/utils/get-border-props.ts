import { B, BOTTOM, L, LEFT, R, RIGHT, T, TOP, X, Y } from '../constants/direction';

const BORDER_DASH = 'border-';

export function getBorderProps(name: string, declaration, suffix = '') {
    if (suffix) {
        suffix = '-' + suffix;
    }
    const direction = /^b(order)?-?(.)?/.exec(name)[2];
    const BORDER_LEFT = BORDER_DASH + LEFT + suffix;
    const BORDER_RIGHT = BORDER_DASH + RIGHT + suffix;
    const BORDER_TOP = BORDER_DASH + TOP + suffix;
    const BORDER_BOTTOM = BORDER_DASH + BOTTOM + suffix;
    switch (direction) {
        case X:
            return {
                [BORDER_LEFT]: declaration,
                [BORDER_RIGHT]: declaration
            }
        case Y:
            return {
                [BORDER_TOP]: declaration,
                [BORDER_BOTTOM]: declaration
            }
        case L:
            return {
                [BORDER_LEFT]: declaration
            }
        case R:
            return {
                [BORDER_RIGHT]: declaration
            }
        case T:
            return {
                [BORDER_TOP]: declaration
            }
        case B:
            return {
                [BORDER_BOTTOM]: declaration
            }
        default:
            return {
                ['border' + suffix]: declaration
            }
    }
}