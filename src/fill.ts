import { FILL } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class FillStyle extends MasterStyle {
    static override prefixes = /^fill:/;
    static override properties = [FILL];
}