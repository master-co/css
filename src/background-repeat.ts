import { MasterVirtualClass } from './virtual-class';
import { BACKGROUND, DASH, REPEAT } from './constants/css-property-keyword';

export class MasterBackgroundRepeatVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^(bg-repeat:|bg:(repeat|no-repeat|repeat-x|repeat-y))/;
    static override properties = [BACKGROUND + DASH + REPEAT];
}