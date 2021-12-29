import { DASH, STYLE, TRANSFORM } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransformStyleStyle extends Style {
    static override matches =  /^transform:(flat|preserve-3d)(?!;)/;
    static override key = TRANSFORM + DASH + STYLE;
}