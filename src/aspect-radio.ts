import { Style } from '@master/style';
import { SQUARE, VIDEO, ASPECT, RATIO, DASH } from './constants/css-property-keyword';

export class AspectRadioStyle extends Style {
    static override matches = /^aspect:./;
    static override key = ASPECT + DASH + RATIO;
    static override unit = '';
    static override semantics = {
        [SQUARE]: '1/1',
        [VIDEO]: '16/9'
    };
}