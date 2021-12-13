import { HEIGHT } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class HeightStyle extends MasterStyle {
    static override prefixes =  /^h:/;
    static override properties = [HEIGHT];
    static override semantics = {
        'h:full': '100%'
    }
}