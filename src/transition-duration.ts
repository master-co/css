import { DASH, DURATION, TRANSITION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TransitionDurationStyle extends MasterStyle {
    static override prefixes =  /^~duration:/;
    static override properties = [TRANSITION + DASH + DURATION];
}