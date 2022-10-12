import { ANIMATION, dash, FILL, MODE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'AnimationFillMode'
    static override matches = /^\@fill-mode:./;
    static override propName = dash(ANIMATION, FILL, MODE);
}