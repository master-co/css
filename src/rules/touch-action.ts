import { MasterCSSRule } from '../rule';
import { ACTION, dash, TOUCH } from '../constants/css-property-keyword';

export class TouchAction extends MasterCSSRule {
    static override key = dash(TOUCH, ACTION);
}