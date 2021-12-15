import { DASH, FAMILY, FONT, F_PREFIX, MONO, SANS, SERIF, VAR_END, VAR_START } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const F_DASH = 'f-';

export class FontFamilyStyle extends MasterStyle {
    static override prefixes = /^f-family:/;
    static override properties = [FONT + DASH + FAMILY];
    static override semantics = {
        [F_PREFIX + MONO]: VAR_START + F_DASH + MONO + VAR_END,
        [F_PREFIX + SANS]: VAR_START + F_DASH + SANS + VAR_END,
        [F_PREFIX + SERIF]: VAR_START + F_DASH + SERIF + VAR_END
    }
}