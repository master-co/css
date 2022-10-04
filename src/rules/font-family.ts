import { dash, FAMILY, FONT } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class FontFamily extends MasterCSSRule {
    static override matches = /^f(ont)?:(mono|sans|serif)(?!\|)/;
    static override key = dash(FONT, FAMILY);
}