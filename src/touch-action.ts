import { MasterStyle } from '@master/style';
import { ACTION, DASH, TOUCH } from './constants/css-property-keyword';

export class MasterTouchActionStyle extends MasterStyle {
    static override prefixes = /^touch-action:/;
    static override properties = [TOUCH + DASH + ACTION];
}