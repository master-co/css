import { DASH, FAMILY, FONT, MONO, SANS, SERIF, VAR_END, VAR_START } from './constants/css-property-keyword';
import { Style } from '@master/style';

const VAR_F = VAR_START + 'f' + DASH;

export class FontFamilyStyle extends Style {
    static override matches = /^f-family:|f(ont)?:(mono|sans|serif)/;
    static override key = FONT + DASH + FAMILY;
    static override values = {
        mono: VAR_F + MONO + VAR_END,
        sans: VAR_F + SANS + VAR_END,
        serif: VAR_F + SERIF + VAR_END
    }
}