import { BORDER, DASH } from '../constants/css-property-keyword';
import { B, BOTTOM, L, LEFT, R, RIGHT, T, TOP, X, Y } from '../constants/direction';

const BORDER_DASH = BORDER + DASH;

export function getBorderProps(name: string, propertyInfo, suffix = '') {
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
                [BORDER_LEFT]: propertyInfo,
                [BORDER_RIGHT]: propertyInfo
            }
        case Y:
            return {
                [BORDER_TOP]: propertyInfo,
                [BORDER_BOTTOM]: propertyInfo
            }
        case L:
            return {
                [BORDER_LEFT]: propertyInfo
            }
        case R:
            return {
                [BORDER_RIGHT]: propertyInfo
            }
        case T:
            return {
                [BORDER_TOP]: propertyInfo
            }
        case B:
            return {
                [BORDER_BOTTOM]: propertyInfo
            }
        default:
            return {
                [BORDER + suffix]: propertyInfo
            }
    }
}