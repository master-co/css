import { MasterStyle } from '@master/style';
import { DASH, SELECT, USER } from './constants/css-property-keyword';
import { WEBKIT_PREFIX } from './constants/css-browser-prefix';

const USER_SELECT = USER + DASH + SELECT;

export class UserSelectStyle extends MasterStyle {
    static override prefixes = /^user-select:/;
    static override properties = [
        USER_SELECT,
        WEBKIT_PREFIX + USER_SELECT
    ];
}