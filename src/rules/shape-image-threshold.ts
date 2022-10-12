import { MasterCSSRule } from '../rule';
import { dash, IMAGE, SHAPE } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'ShapeImageThreshold'
    static override propName = dash(SHAPE, IMAGE, 'threshold');
    static override unit = '';
}