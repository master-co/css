import { MasterCSSRule } from '../rule';
import { dash, IMAGE } from '../constants/css-property-keyword';

export class MaskImage extends MasterCSSRule {
    static override propName = dash('mask', IMAGE)
    override getProps(propertyInfo): { [key: string]: any } {
        return {
            'mask-image': propertyInfo,
            '-webkit-mask-image': propertyInfo
        }
    }
}