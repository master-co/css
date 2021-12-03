import { DASH, STYLE, TRANSFORM } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterTransformStyleStyle extends MasterStyle {
    static override prefixes =  /^(transform-style:|transform:(flat|preserve-3d))/;
    static override properties = [TRANSFORM + DASH + STYLE];
}