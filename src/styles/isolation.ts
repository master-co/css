import { ISOLATE, ISOLATION } from '../constants/css-property-keyword';
import { Style } from '../style';

export class Isolation extends Style {
    static override key = ISOLATION;
    static override semantics = {
        isolate: ISOLATE
    }
}