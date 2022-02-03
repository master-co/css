import { FLEX } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class FlexStyle extends Style {
    static override key = FLEX;
    static override unit = '';
    override get getOrder(): number {
        return -1;
    }
}