import { Style } from '@master/style';
import { TOP, RIGHT, BOTTOM, LEFT, T, B, L, R } from './constants/direction';
import { BORDER, DASH, RADIUS, ROUND, ROUNDED } from './constants/css-property-keyword';

const BORDER_TOP_LEFT_RADIUS = BORDER + DASH + TOP + DASH + LEFT + DASH + RADIUS,
    BORDER_TOP_RIGHT_RADIUS = BORDER + DASH + TOP + DASH + RIGHT + DASH + RADIUS,
    BORDER_BOTTOM_LEFT_RADIUS = BORDER + DASH + BOTTOM + DASH + LEFT + DASH + RADIUS,
    BORDER_BOTTOM_RIGHT_RADIUS = BORDER + DASH + BOTTOM + DASH + RIGHT + DASH + RADIUS,
    BORDER_RADIUS = BORDER + DASH + RADIUS,
    BORDER_RADIUS_S = [BORDER_TOP_LEFT_RADIUS, BORDER_TOP_RIGHT_RADIUS, BORDER_BOTTOM_LEFT_RADIUS, BORDER_BOTTOM_RIGHT_RADIUS];

export class BorderRadiusStyle extends Style {
    static override prefixes = /^((r(t|b|l|r)?(t|b|l|r)?|border(-(top|bottom)-(left|right))?-radius):)/;
    static override semantics = {
        [ROUNDED]: '1e9em',
        [ROUND]: '50%'
    }
    override get props(): { [key: string]: any } {
        if (this.prefix) {
            const suffix = this.prefix.slice(1, -1);
            switch (suffix) {
                case T:
                    return {
                        [BORDER_TOP_LEFT_RADIUS]: this,
                        [BORDER_TOP_RIGHT_RADIUS]: this
                    }
                case 'tl':
                case 'lt':
                    return {
                        [BORDER_TOP_LEFT_RADIUS]: this
                    };
                case 'rt':
                case 'tr':
                    return {
                        [BORDER_TOP_RIGHT_RADIUS]: this
                    }
                case B:
                    return {
                        [BORDER_BOTTOM_LEFT_RADIUS]: this,
                        [BORDER_BOTTOM_RIGHT_RADIUS]: this
                    }
                case 'bl':
                case 'lb':
                    return {
                        [BORDER_BOTTOM_LEFT_RADIUS]: this
                    }
                case 'br':
                case 'rb':
                    return {
                        [BORDER_BOTTOM_RIGHT_RADIUS]: this
                    }
                case L:
                    return {
                        [BORDER_TOP_LEFT_RADIUS]: this,
                        [BORDER_BOTTOM_LEFT_RADIUS]: this
                    }
                case R:
                    return {
                        [BORDER_TOP_RIGHT_RADIUS]: this,
                        [BORDER_BOTTOM_RIGHT_RADIUS]: this
                    }
                default:
                    return {
                        [BORDER_RADIUS]: this
                    }
            }
        }

        const prefix = this.prefix?.slice(0, -1);
        return {
            [BORDER_RADIUS_S.includes(prefix) ? prefix : BORDER_RADIUS]: this
        }
    }
}