import { BORDER, BOX, CONTENT, DASH, SIZING } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

const CONTENT_BOX = CONTENT + DASH + BOX;
const BORDER_BOX = BORDER + DASH + BOX;

export class MasterBoxSizingVirtualClass extends MasterVirtualClass {
    static override properties = [BOX + DASH + SIZING];
    static override semantics = {
        [CONTENT_BOX]: CONTENT_BOX,
        [BORDER_BOX]: BORDER_BOX
    }
}