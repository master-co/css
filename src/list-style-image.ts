import { DASH, IMAGE, LIST, STYLE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class ListStyleImageStyle extends Style {
    static override matches = /^list-style:(url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)((?!;).)*$/;
    static override key = LIST + DASH + STYLE + DASH + IMAGE;
}