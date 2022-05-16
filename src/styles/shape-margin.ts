import { Style } from '../style';
import { dash, MARGIN, SHAPE } from '../constants/css-property-keyword';

export class ShapeMargin extends Style {
    static override matches = /^shape:([0-9]|(max|min|calc|clamp)\(.*\))((?!;).)*$/
    static override key = dash(SHAPE, MARGIN);
}