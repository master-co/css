import { COLOR, DASH, OUTLINE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class OutlineColor extends Style {
    static override key = OUTLINE + DASH + COLOR;
    static override colorStarts = 'outline:';
    static override colorful = true;
}