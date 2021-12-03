import { CLEAR } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class MasterClearStyle extends MasterStyle {
    static override prefixes = /^clear:/;
    static override properties = [CLEAR];
}