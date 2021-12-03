import { MasterVirtualClass } from './virtual-class';
import { DASH, SELECT, USER } from './constants/css-property-keyword';
import { WEBKIT_PREFIX } from './constants/css-browser-prefix';

const USER_SELECT = USER + DASH + SELECT;

export class MasterUserSelectVirtualClass extends MasterVirtualClass {
    static override prefixes = /^user-select:/;
    static override properties = [
        USER_SELECT,
        WEBKIT_PREFIX + USER_SELECT
    ];
}