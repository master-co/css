import { FLEX } from '../constants/css-property-keyword';
import { Style } from '../style';

export class Flex extends Style {
    static override key = FLEX;
    static override unit = '';
    override order = -1;
}