import { BREAK, DASH, SPACE, WHITE } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

const WHITE_SPACE = WHITE + DASH + SPACE;
const BREAK_SPACES = BREAK + DASH + SPACE + 's';

export class MasterWhiteSpaceVirtualClass extends MasterVirtualClass {
    static override prefixes = /^(ws|white-space):/;
    static override properties = [WHITE_SPACE];
    static override defaultUnit = '';
    static override semantics = {
        // break-spaces
        [BREAK_SPACES]: {
            [WHITE_SPACE]: BREAK_SPACES
        }
    }
}