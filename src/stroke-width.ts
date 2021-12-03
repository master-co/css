import { DASH, STROKE, WIDTH } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterStrokeWidthStyle extends MasterStyle {
    static override prefixes = /^stroke-width:/;
    static override properties = [STROKE + DASH + WIDTH];
}