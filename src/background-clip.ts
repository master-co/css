import { MasterVirtualClass } from './virtual-class';
import { BACKGROUND, CLIP, DASH } from './constants/css-property-keyword';
import { WEBKIT_PREFIX } from './constants/css-browser-prefix';

const BACKGROUND_CLIP = BACKGROUND + DASH + CLIP;

export class MasterBackgroundClipVirtualClass extends MasterVirtualClass {
    static override prefixes = /^bg-clip:/;
    static override properties = [
        WEBKIT_PREFIX + BACKGROUND_CLIP,
        BACKGROUND_CLIP
    ];
}