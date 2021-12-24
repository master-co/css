import { COLOR, DASH, DECORATION, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationColorStyle extends Style {
    static override prefixes =  /^t-decoration-color:/;
    static override key = TEXT + DASH + DECORATION + DASH + COLOR;
    static override colorStarts = 't(ext)?-decoration:';
}