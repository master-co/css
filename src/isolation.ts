import { ISOLATE, ISOLATION } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterIsolationVirtualClass extends MasterVirtualClass {
    static override prefixes = /^isolation:/;
    static override properties = [ISOLATION];
    static override semantics = {
        [ISOLATE]: ISOLATE
    }
}