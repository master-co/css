import { OUTLINE } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class OutlineStyle extends Style {
    static override matches = /^outline:./;
    static override key = OUTLINE;
    override get getOrder(): number {
        return -1;
    }
}