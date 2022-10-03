import { dash, FONT, STYLE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class FontStyle extends MasterCSSRule {
    static override matches = /^f(ont)?:(normal|italic|oblique)(?!\|)/;
    static override key = dash(FONT, STYLE);
    static override unit = 'deg';
    static override semantics = {
        italic: 'italic',
        oblique: 'oblique'
    };
}