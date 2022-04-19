import { Style } from '@master/style';
import { AUTO } from './constants/css-property-keyword';

export class Inset extends Style {
    static override matches = /^(?:top|bottom|left|right):./;
    static override key = 'inset';
    static override semantics = {
        center: {
            left: 0,
            right: 0,
            'margin-left': AUTO,
            'margin-right': AUTO
        },
        middle: {
            top: 0,
            bottom: 0,
            'margin-top': AUTO,
            'margin-bottom': AUTO
        }
    }
}