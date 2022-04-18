import { COLOR, DASH, DECORATION, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationColor extends Style {
    static override key = TEXT + DASH + DECORATION + DASH + COLOR;
    static override colorStarts = 'text-decoration:';
    static override colorful = true;
}