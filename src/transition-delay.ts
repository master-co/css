import { DASH, DELAY, TRANSITION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TransitionDelayStyle extends MasterStyle {
    static override prefixes =  /^~delay:/;
    static override properties = [TRANSITION + DASH + DELAY];
}