import { COLOR, DASH, DECORATION, TEXT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class TextDecorationColorStyle extends Style {
    static override key = TEXT + DASH + DECORATION + DASH + COLOR;
    static override colorMatches = /^text-decoration:(#|(rgb|hsl)\(.*\))((?!;).)*$/;
    static override colorful = true;
}