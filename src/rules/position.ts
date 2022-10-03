import { ABSOLUTE, POSITION, RELATIVE } from '../constants/css-property-keyword';
import { MasterCSSRule } from '../rule';

export class Position extends MasterCSSRule {
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