import { dash, STROKE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'StrokeDasharray'
    static override propName = dash(STROKE, 'dasharray');
}