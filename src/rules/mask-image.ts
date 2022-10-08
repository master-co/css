import { MasterCSSRule } from '../rule';
import { dash, IMAGE } from '../constants/css-property-keyword';

export class MaskImage extends MasterCSSRule {
    static override propName = dash('mask', IMAGE)
    override get(declaration): { [key: string]: any } {
        return {
            'mask-image': declaration,
            '-webkit-mask-image': declaration
        }
    }
}