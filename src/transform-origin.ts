import { DASH, ORIGIN, PX, TRANSFORM } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransformOrigin extends Style {
    static override matches =  /^transform:((top|bottom|right|left|center)|\d)/;
    static override key = TRANSFORM + DASH + ORIGIN;
    static override unit = PX;
}