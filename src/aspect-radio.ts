import { Style } from '@master/style';
import { SQUARE, VIDEO, ASPECT, RATIO, DASH } from './constants/css-property-keyword';

export class AspectRadioStyle extends Style {
    static override prefixes = /^aspect:/;
    static override property = ASPECT + DASH + RATIO;
    static override unit = '';
    static override semantics = {
        [SQUARE]: '1/1',
        [VIDEO]: '16/9'
    };
}