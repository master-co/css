import { ANIMATION, dash, PLAY_STATE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class AnimationPlayState extends MasterCSSRule {
    static override matches = /^\@play-state:./;
    static override key = dash(ANIMATION, PLAY_STATE);
}