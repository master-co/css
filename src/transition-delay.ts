import { DASH, DELAY, TRANSITION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterTransitionDelayStyle extends MasterStyle {
    static override prefixes =  /^(transition-delay|~delay):/;
    static override properties = [TRANSITION + DASH + DELAY];
}