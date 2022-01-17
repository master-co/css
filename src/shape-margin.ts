import { Style } from '@master/style';
import { DASH, MARGIN, SHAPE } from './constants/css-property-keyword';

export class ShapeMarginStyle extends Style {
    static override matches = /^shape:([0-9]|(max|min|calc|clamp)\(.*\))((?!;).)*$/
    static override key = SHAPE + DASH + MARGIN;
}