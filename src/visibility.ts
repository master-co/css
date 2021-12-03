import { HIDDEN, INVISIBLE, VISIBILITY, VISIBLE } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterVisibilityVirtualClass extends MasterVirtualClass {
    static override prefixes = /^visibility:/;
    static override properties = [VISIBILITY];
    static override semantics = {
        [VISIBLE]: VISIBLE,
        [INVISIBLE]: HIDDEN
    }
}