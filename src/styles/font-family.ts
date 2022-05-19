import { dash, FAMILY, FONT, MONO, SANS, SERIF } from '../constants/css-property-keyword';
import { Style } from '../style';

const VAR_FONT = 'var(--' + FONT + '-';

export class FontFamily extends Style {
    static override matches = /^f(ont)?:(mono|sans|serif)(?!\|)/;
    static override key = dash(FONT, FAMILY);
    static override values = {
        mono: VAR_FONT + MONO + ')',
        sans: VAR_FONT + SANS + ')',
        serif: VAR_FONT + SERIF + ')'
    }
}