import { AUTO, DASH, FLOW, GRID } from './constants/css-property-keyword';
import { MasterStyle } from '@master/style';

export class GridAutoFlowStyle extends MasterStyle {
    static override prefixes = /^grid(-auto)?-flow:/;
    static override supportFullName = false;
    static override properties = [GRID + DASH + AUTO + DASH + FLOW];
}