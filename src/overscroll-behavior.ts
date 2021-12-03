import { OVERSCROLL_BEHAVIOR } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterOverscrollBehaviorVirtualClass extends MasterVirtualClass {
    static override prefixes = /^overscroll-behavior(-x|-y)?:/;
    static override properties = [OVERSCROLL_BEHAVIOR];
}