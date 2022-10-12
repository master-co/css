import { ANIMATION, dash, DIRECTION } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'AnimationDirection'
    static override matches = /^\@direction:./;
    static override propName = dash(ANIMATION, DIRECTION);
}