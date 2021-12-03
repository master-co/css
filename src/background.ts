import { MasterStyle } from '@master/style';
import { BACKGROUND } from './constants/css-property-keyword';

export class MasterBackgroundStyle extends MasterStyle {
    static override prefixes = /^bg:/;
    static override properties = [BACKGROUND];
}