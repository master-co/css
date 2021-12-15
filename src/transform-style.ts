import { DASH, STYLE, TRANSFORM } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TransformStyleStyle extends MasterStyle {
    static override prefixes =  /^transform:(flat|preserve-3d)/;
    static override properties = [TRANSFORM + DASH + STYLE];
}