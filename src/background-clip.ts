import { Style } from '@master/style';
import { BACKGROUND, CLIP, DASH } from './constants/css-property-keyword';
import { WEBKIT_PREFIX } from './constants/css-browser-prefix';

const BACKGROUND_CLIP = BACKGROUND + DASH + CLIP;

export class BackgroundClipStyle extends Style {
    static override prefixes = /^(bg|background)-clip:/;
    static override properties = [
        WEBKIT_PREFIX + BACKGROUND_CLIP,
        BACKGROUND_CLIP
    ];
    static override supportFullName = false;
}