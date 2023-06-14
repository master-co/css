import { MasterCSS } from '../core';
import type { Config } from '../config';
/**
 * @description Extract latent classes from content
 * @param content
 * @param options
 * @returns
 */
export default function extractLatentClasses(content: string, options?: {
    css?: MasterCSS;
    config?: Config;
}): string[];
