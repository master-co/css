import { DASH, JUSTIFY, SELF } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class JustifySelfStyle extends MasterStyle {
    static override prefixes = /^justify-self:/;
    static override properties = [JUSTIFY + DASH + SELF];
}