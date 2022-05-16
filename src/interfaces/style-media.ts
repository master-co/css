import { StyleMediaFeature } from './style-media-feature';

export interface StyleMedia {
    token: string;
    features?: {
        [key: string]: StyleMediaFeature
    }
    type?: string;
}
