import { WIDTH } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class WidthStyle extends MasterStyle {
    static override prefixes =  /^w:/;
    static override properties = [WIDTH];
    static override semantics = {
        'w:full': '100%'
    }
}