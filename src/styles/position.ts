import { ABSOLUTE, POSITION, RELATIVE } from '../constants/css-property-keyword';
import { Style } from '@master/style';

export class Position extends Style {
    static override key = POSITION;
    static override values = {
        'abs': ABSOLUTE,
        'rel': RELATIVE
    };
    static override semantics = {
        static: 'static',
        fixed: 'fixed',
        abs: 'absolute',
        rel: 'relative',
        sticky: 'sticky'
    };
}