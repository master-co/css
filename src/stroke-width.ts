import { DASH, STROKE, WIDTH } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class StrokeWidthStyle extends Style {
    static override prefixes = /^stroke:[0-9]((?!;).)*$/;
    static override key = STROKE + DASH + WIDTH;
}