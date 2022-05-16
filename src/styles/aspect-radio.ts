import { Style } from '@master/style';
import { SQUARE, VIDEO, ASPECT, RATIO, dash } from '../constants/css-property-keyword';

export class AspectRadio extends Style {
    static override matches = /^aspect:./;
    static override key = dash(ASPECT, RATIO);
    static override unit = '';
    static override semantics = {
        [SQUARE]: '1/1',
        [VIDEO]: '16/9'
    };
}