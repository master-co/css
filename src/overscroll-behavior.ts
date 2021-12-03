import { OVERSCROLL_BEHAVIOR } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterOverscrollBehaviorStyle extends MasterStyle {
    static override prefixes = /^overscroll-behavior(-x|-y)?:/;
    static override properties = [OVERSCROLL_BEHAVIOR];
}