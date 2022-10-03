import { ANIMATION, dash, FILL, MODE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class AnimationFillMode extends MasterCSSRule {
    static override matches = /^\@fill-mode:./;
    static override key = dash(ANIMATION, FILL, MODE);
}