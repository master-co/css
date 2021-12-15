import { DASH, PROPERTY, TRANSITION } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class TransitionPropertyStyle extends MasterStyle {
    static override prefixes =  /^~property:/;
    static override properties = [TRANSITION + DASH + PROPERTY];
}