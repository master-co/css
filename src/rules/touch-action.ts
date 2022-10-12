import { MasterCSSRule } from '../rule';
import { ACTION, dash, TOUCH } from '../constants/css-property-keyword';

export default class extends MasterCSSRule {
    static override id = 'TouchAction'
    static override propName = dash(TOUCH, ACTION);
}