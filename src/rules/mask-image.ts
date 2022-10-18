import { MasterCSSRule } from '../rule'

export default class extends MasterCSSRule {
    static override id = 'MaskImage'
    static override propName = 'mask-image'
    override get(declaration): { [key: string]: any } {
        return {
            'mask-image': declaration,
            '-webkit-mask-image': declaration
        }
    }
}