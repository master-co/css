import { DASH, STYLE, TRANSFORM } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransformStyleStyle extends Style {
    static override prefixes =  /^transform:(flat|preserve-3d)/;
    static override properties = [TRANSFORM + DASH + STYLE];
}