import { ANIMATION, DASH, DELAY } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class AnimationDelayStyle extends MasterStyle {
    static override prefixes = /^\*delay:/;
    static override properties = [ANIMATION + DASH + DELAY];
}