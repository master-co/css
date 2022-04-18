import { Style } from '@master/style';
import { BACKGROUND, BORDER, BOX, CONTENT, DASH, ORIGIN, PADDING } from './constants/css-property-keyword';

export class BackgroundOrigin extends Style {
    static override matches = /^(bg|background):(content|border|padding)(?!;)/;
    static override key = BACKGROUND + DASH + ORIGIN;
    static override values = {
        content: CONTENT + DASH + BOX,
        border: BORDER + DASH + BOX,
        padding: PADDING + DASH + BOX
    }
}