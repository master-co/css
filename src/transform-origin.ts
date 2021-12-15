import { DASH, ORIGIN, TRANSFORM } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TransformOriginStyle extends MasterStyle {
    static override prefixes =  /^transform:(top|bottom|right|left|center)/;
    static override properties = [TRANSFORM + DASH + ORIGIN];
}