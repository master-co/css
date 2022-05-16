import { Style } from '../style';
import { dash, IMAGE, SHAPE } from '../constants/css-property-keyword';

export class ShapeImageThreshold extends Style {
    static override key = dash(SHAPE, IMAGE, 'threshold');
    static override unit = '';
}