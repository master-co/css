import { dash, OFFSET, STROKE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class StrokeDashoffset extends Style {
    static override key = dash(STROKE, 'dash') + OFFSET;
}