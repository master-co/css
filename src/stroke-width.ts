import { DASH, STROKE, WIDTH } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class StrokeWidthStyle extends Style {
    static override properties = [STROKE + DASH + WIDTH];
}