import { ANIMATION } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class AnimationStyle extends Style {
    static override symbol = '*'; 
    static override properties = [ANIMATION];
}