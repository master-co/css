import { Style } from '../style';
import { BACKGROUND, dash, IMAGE } from '../constants/css-property-keyword';

export class BackgroundImage extends Style {
    static override matches = /^(bg|background):(url|linear-gradient|radial-gradient|repeating-linear-gradient|repeating-radial-gradient|conic-gradient)\(.*\)((?!;).)*$/;
    static override key = dash(BACKGROUND, IMAGE);
}