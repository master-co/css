import { COLOR } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FontColorStyle extends Style {
    static override matches = /^font-color:./;
    static override colorMatches = /^f(ont)?:(#|(rgb|hsl)\(.*\))((?!;).)*$/;
    static override colorful = true;
    static override key = COLOR;
    static override unit = '';
}