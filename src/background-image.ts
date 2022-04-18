import { Style } from '@master/style';
import { BACKGROUND, DASH, IMAGE } from './constants/css-property-keyword';

export class BackgroundImage extends Style {
    static override matches = /^(bg|background):(url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)((?!;).)*$/;
    static override key = BACKGROUND + DASH + IMAGE;
}