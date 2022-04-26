import { ANIMATION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class Animation extends Style {
    static override symbol = '@'; 
    static override key = ANIMATION;
    static override unit = '';
    override order = -1;
}