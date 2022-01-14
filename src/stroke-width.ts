import { DASH, STROKE, WIDTH } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class StrokeWidthStyle extends Style {
    static override matches = /^stroke:([0-9]|(max|min|calc|clamp)\(.*\))((?!;).)*$/;
    static override key = STROKE + DASH + WIDTH;
}