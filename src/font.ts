import { FONT } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontStyle extends Style {
    static override matches = /^f:./;
    static override key = FONT;
    static override unit = '';
    static override colorful = true;
    override get getOrder(): number {
        return -1;
    }
}