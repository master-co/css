import { ANIMATION, DASH, PLAY_STATE, TIMING_FUNCTION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class AnimationTimingFunctionStyle extends MasterStyle {
    static override prefixes = /^(animation-timing-function|\*easing):/;
    static override properties = [ANIMATION + DASH + TIMING_FUNCTION];
}