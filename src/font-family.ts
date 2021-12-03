import { DASH, FAMILY, FONT, F_PREFIX } from './constants/css-property-keyword';
import { MasterVirtualClass } from './virtual-class';

export class MasterFontFamilyVirtualClass extends MasterVirtualClass {
    static override prefixes =  /^f-family:/;
    static override properties = [FONT + DASH + FAMILY];
    static override semantics = {
        [F_PREFIX + 'mono']: 'var(--f-family-mono)',
        [F_PREFIX + 'sans']: 'var(--f-family-sans)',
        [F_PREFIX + 'serif']: 'var(--f-family-serif)'
    }
}