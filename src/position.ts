import { FIXED, POSITION, STATIC, STICKY } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterPositionVirtualClass extends MasterVirtualClass {
    static override prefixes = /^position:/;
    static override properties = [POSITION];
    static override semantics = {
        [STATIC]: STATIC,
        [FIXED]: FIXED,
        'abs': 'absolute',
        'rel': 'relative',
        [STICKY]: STICKY
    }
}