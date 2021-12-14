import { MasterStyle } from '@master/style';
import { SQUARE, VIDEO, ASPECT, RATIO, DASH } from './constants/css-property-keyword';

export class AspectRadioStyle extends MasterStyle {
    static override prefixes = /^aspect:/;
    static override properties = [ASPECT + DASH + RATIO];
    static override semantics = {
        [SQUARE]: '1/1',
        [VIDEO]: '16/9'
    };
}