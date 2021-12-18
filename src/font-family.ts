import { DASH, FAMILY, FONT, FONT_PREFIX, F_PREFIX, MONO, SANS, SERIF, VAR_END, VAR_START } from './constants/css-property-keyword';
import { Style } from '@master/style';

const VAR_F = VAR_START + 'f' + DASH;

export class FontFamilyStyle extends Style {
    static override prefixes = /^f-family:/;
    static override key = FONT + DASH + FAMILY;
    static override values = {
        mono: VAR_F + MONO + VAR_END,
        sans: VAR_F + SANS + VAR_END,
        serif: VAR_F + SERIF + VAR_END
    }
    static override semantics = {};
}

for (const name in FontFamilyStyle.values) {
    const value = FontFamilyStyle.values[name];
    FontFamilyStyle.semantics[F_PREFIX + name] = value;
    FontFamilyStyle.semantics[FONT_PREFIX + name] = value;
}