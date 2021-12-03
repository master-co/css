import { MasterVirtualClass } from './virtual-class';
import { BACKGROUND, BLEND, DASH, MODE } from './constants/css-property-keyword';

export class MasterBackgroundBlendModeVirtualClass extends MasterVirtualClass {
    static override prefixes = /^bg-blend:/;
    static override properties = [BACKGROUND + DASH + BLEND + DASH + MODE];
}