import { DASH, DELAY, TRANSITION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TransitionDelayStyle extends Style {
    static override prefixes =  /^~delay:/;
    static override properties = [TRANSITION + DASH + DELAY];
}