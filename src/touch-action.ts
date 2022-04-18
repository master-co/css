import { Style } from '@master/style';
import { ACTION, DASH, TOUCH } from './constants/css-property-keyword';

export class TouchAction extends Style {
    static override key = TOUCH + DASH + ACTION;
}