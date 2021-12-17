import { DASH, HEIGHT, LINE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class LineHeightStyle extends Style {
    static override prefixes =  /^lh:/;
    static override properties = [LINE + DASH + HEIGHT];
    static override unit = '';
}