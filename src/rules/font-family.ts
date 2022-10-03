import { dash, FAMILY, FONT, MONO, SANS, SERIF } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

const VAR_FONT = 'var(--' + FONT + '-';

export class FontFamily extends MasterCSSRule {
    static override matches = /^f(ont)?:(mono|sans|serif)(?!\|)/;
    static override key = dash(FONT, FAMILY);
    static override values = {
        mono: VAR_FONT + MONO + ')',
        sans: VAR_FONT + SANS + ')',
        serif: VAR_FONT + SERIF + ')'
    }
}