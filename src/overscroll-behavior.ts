import { OVERSCROLL_BEHAVIOR } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class OverscrollBehaviorStyle extends MasterStyle {
    static override prefixes = /^overscroll-behavior(-x|-y)?:/;
    static override properties = [OVERSCROLL_BEHAVIOR];
}