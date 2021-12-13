import { CLEAR } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class ClearStyle extends MasterStyle {
    static override prefixes = /^clear:/;
    static override properties = [CLEAR];
}