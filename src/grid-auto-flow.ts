import { AUTO, DASH, FLOW, GRID } from './constants/css-property-keyword';
import { Style } from '@master/style';

export class GridAutoFlowStyle extends Style {
    static override prefixes = /^grid(-auto)?-flow:/;
    static override supportFullName = false;
    static override properties = [GRID + DASH + AUTO + DASH + FLOW];
}