import { BORDER, BOX, CONTENT, dash, SIZING } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class BoxSizing extends Style {
    static override matches = /^box:(content|border)(?!;)/;
    static override key = dash(BOX, SIZING);
    static override values = {
        content: dash(CONTENT, BOX),
        border: dash(BORDER, BOX)
    }
}