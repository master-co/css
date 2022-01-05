import { DASH, FAMILY, FONT, MONO, SANS, SERIF, VAR_END, VAR_START } from './constants/css-property-keyword';
import { Style } from '@master/style';

const VAR_FONT = VAR_START + 'font' + DASH;

export class FontFamilyStyle extends Style {
    static override matches = /^f(ont)?:(mono|sans|serif)(?!;)/;
    static override key = FONT + DASH + FAMILY;
    static override values = {
        mono: VAR_FONT + MONO + VAR_END,
        sans: VAR_FONT + SANS + VAR_END,
        serif: VAR_FONT + SERIF + VAR_END
    }
}