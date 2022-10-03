import { dash, STROKE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class StrokeDasharray extends MasterCSSRule {
    static override key = dash(STROKE, 'dasharray');
}