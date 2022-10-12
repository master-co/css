import { ANIMATION, dash, PLAY_STATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export default class extends MasterCSSRule {
    static override id = 'AnimationPlayState'
    static override matches = /^\@play-state:./;
    static override propName = dash(ANIMATION, PLAY_STATE);
}