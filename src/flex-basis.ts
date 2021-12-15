import { BASIS, DASH, FLEX, FULL } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

const FLEX_BASIS = FLEX + DASH + BASIS;

export class FlexBasisStyle extends MasterStyle {
    static override properties = [FLEX_BASIS];
    static override semantics = {
        [FLEX_BASIS + ':' + FULL]: '100%'
    }
}