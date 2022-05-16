import { Style } from '../style';
import { BORDER, dash, IMAGE } from '../constants/css-property-keyword';

export class BorderImageSource extends Style {
    static override matches = /^border-image:(?:url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)(?:(?!;).)*$/;
    static override key = dash(BORDER, IMAGE, 'source');
}