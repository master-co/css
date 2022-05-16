import { dash, STROKE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class StrokeDasharray extends Style {
    static override key = dash(STROKE, 'dasharray');
}