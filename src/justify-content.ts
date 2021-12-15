import { CONTENT, DASH, JUSTIFY } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class JustifyContentStyle extends MasterStyle {
    static override prefixes = /^justify(-content)?:/;
    static override properties = [JUSTIFY + DASH + CONTENT];

}