import { DASH, FAMILY, FONT, MONO, SANS, SERIF, VAR_END, VAR_START } from './constants/css-property-keyword';
import { Style } from '@master/style';

const VAR_F = VAR_START + 'f' + DASH;

export class FontFamilyStyle extends Style {
    static override prefixes = /^f(ont)?-family:/;
    static override supportFullName = false;
    static override properties = [FONT + DASH + FAMILY];
    static override values = {
        [MONO]: VAR_F + MONO + VAR_END,
        [SANS]: VAR_F + SANS + VAR_END,
        [SERIF]: VAR_F + SERIF + VAR_END
    }
}