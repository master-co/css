import { BORDER, DASH } from '../constants/css-property-keyword';
import { B, BOTTOM, L, LEFT, R, RIGHT, T, TOP, X, Y } from '../constants/direction';

const BORDER_DASH = BORDER + DASH;

export function getBorderProps(name: string, instance: object, suffix = '') {
    if (suffix) {
        suffix = DASH + suffix;
    }

    const direction = /^b(order)?-?(.)?/.exec(name)[2];
    const BORDER_LEFT = BORDER_DASH + LEFT + suffix;
    const BORDER_RIGHT = BORDER_DASH + RIGHT + suffix;
    const BORDER_TOP = BORDER_DASH + TOP + suffix;
    const BORDER_BOTTOM = BORDER_DASH + BOTTOM + suffix;
    switch (direction) {
        case X:
            return {
                [BORDER_LEFT]: instance,
                [BORDER_RIGHT]: instance
            }
        case Y:
            return {
                [BORDER_TOP]: instance,
                [BORDER_BOTTOM]: instance
            }
        case L:
            return {
                [BORDER_LEFT]: instance
            }
        case R:
            return {
                [BORDER_RIGHT]: instance
            }
        case T:
            return {
                [BORDER_TOP]: instance
            }
        case B:
            return {
                [BORDER_BOTTOM]: instance
            }
        default:
            return {
                [BORDER + suffix]: instance
            }
    }
}