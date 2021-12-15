import { DASH, STROKE, WIDTH } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class StrokeWidthStyle extends MasterStyle {
    static override properties = [STROKE + DASH + WIDTH];
}