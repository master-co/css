import { MasterCSSMediaFeatureRule } from './media-feature-rule'

export interface MasterCSSMedia {
    token: string;
    features?: {
        [key: string]: MasterCSSMediaFeatureRule
    }
    type?: string;
}
