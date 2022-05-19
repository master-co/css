import { dash, STROKE, WIDTH } from '../constants/css-property-keyword';
import { Style } from '../style';

export class StrokeWidth extends Style {
    static override matches = /^stroke:([0-9]|(max|min|calc|clamp)\(.*\))((?!\|).)*$/;
    static override key = dash(STROKE, WIDTH);
}