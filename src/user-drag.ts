import { Style } from '@master/style';
import { WEBKIT_PREFIX } from './constants/css-browser-prefix';
import { DASH, DRAG, USER } from './constants/css-property-keyword';

const USER_DRAG = USER + DASH + DRAG;

export class UserDragStyle extends Style {
    static override prefixes = /^user-drag:/;
    static override supportFullName = false;
    static override properties = [
        USER_DRAG,
        WEBKIT_PREFIX + USER_DRAG
    ];
}