import { dash, FONT, STYLE } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class FontStyle extends Style {
    static override matches = /^f(ont)?:(normal|italic|oblique)(?!;)/;
    static override key = dash(FONT, STYLE);
    static override unit = 'deg';
}