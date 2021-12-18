import { DASH, OUTLINE, STYLE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class OutlineStyleStyle extends Style {
    static override property = OUTLINE + DASH + STYLE;
}