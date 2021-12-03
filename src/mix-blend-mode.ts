import { MasterVirtualClass } from './virtual-class';
import { BLEND, DASH, MIX, MODE } from './constants/css-property-keyword';

export class MasterMixBlendModeVirtualClass extends MasterVirtualClass {
    static override prefixes = /^blend:/;
    static override properties = [MIX + DASH + BLEND + DASH + MODE];
}