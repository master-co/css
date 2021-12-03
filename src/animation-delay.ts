import { ANIMATION, DASH, DELAY } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterAnimationDelayStyle extends MasterStyle {
    static override prefixes = /^(animation-delay|\*delay):/;
    static override properties = [ANIMATION + DASH + DELAY];
}