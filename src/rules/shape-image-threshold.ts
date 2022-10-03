import { MasterCSSRule } from '../rule';
import { dash, IMAGE, SHAPE } from '../constants/css-property-keyword';

export class ShapeImageThreshold extends MasterCSSRule {
    static override key = dash(SHAPE, IMAGE, 'threshold');
    static override unit = '';
}