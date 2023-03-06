import { RuleConfig } from '../rule'

export const maskImage: RuleConfig = {
    get(declaration): { [key: string]: any } {
        return {
            'mask-image': declaration,
            '-webkit-mask-image': declaration
        }
    }
}