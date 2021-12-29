import { BORDER, BOX, CONTENT, DASH, SIZING } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class BoxSizingStyle extends Style {
    static override matches = /^box:(content|border)(?!;)/;
    static override key = BOX + DASH + SIZING;
    static override values = {
        content: CONTENT + DASH + BOX,
        border: BORDER + DASH + BOX
    }
}