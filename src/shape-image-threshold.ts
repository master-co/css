import { Style } from '@master/style';
import { DASH, IMAGE, SHAPE } from './constants/css-property-keyword';

export class ShapeImageThresholdStyle extends Style {
    static override key = SHAPE + DASH + IMAGE + DASH + 'threshold';
    static override unit = '';
}