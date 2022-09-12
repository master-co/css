import { dash, MODE } from '../constants/css-property-keyword';
import { Style } from '../style';

export class WritingMode extends Style {
    static override matches = /^writing:./;
    static override key = dash('writing', MODE);
}