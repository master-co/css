import { FONT } from '../constants/css-property-keyword';
import { Style } from '../style';

export class Font extends Style {
    static override matches = /^f:./;
    static override key = FONT;
    static override unit = '';
    static override colorful = true;
    override order = -1;
}