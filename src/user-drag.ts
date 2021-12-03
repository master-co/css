import { MasterVirtualClass } from './virtual-class';
import { WEBKIT_PREFIX } from './constants/css-browser-prefix';
import { DASH, DRAG, USER } from './constants/css-property-keyword';

const USER_DRAG = USER + DASH + DRAG;

export class MasterUserDragVirtualClass extends MasterVirtualClass {
    static override prefixes = /^user-drag:/;
    static override properties = [
        USER_DRAG,
        WEBKIT_PREFIX + USER_DRAG
    ];
}