import { Style } from '@master/style';
import { ACTION, dash, TOUCH } from '../constants/css-property-keyword';

export class TouchAction extends Style {
    static override key = dash(TOUCH, ACTION);
}