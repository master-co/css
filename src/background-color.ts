import { Style } from '@master/style';
import { BACKGROUND, COLOR, DASH } from './constants/css-property-keyword';

export class BackgroundColorStyle extends Style {
    static override matches = /^(bg|background):transparent(?!;)/;
    static override colorMatches = /^(bg|background):(#|(rgb|hsl)\(.*\))((?!;).)*$/;
    static override key = BACKGROUND + DASH + COLOR;
    static override unit = '';
    static override colorful = true;
}