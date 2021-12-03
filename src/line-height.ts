import { DASH, HEIGHT, LINE } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterLineHeightVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(lh|line-height):/;
    static override properties = [LINE + DASH + HEIGHT];
    static override defaultUnit = '';
}