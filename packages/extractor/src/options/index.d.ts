import type { Config } from '@master/css';
import type { Pattern as FastGlobPattern } from 'fast-glob';
declare const options: Options;
export interface Options {
    verbose?: number;
    config?: string | Config;
    output?: string;
    path?: string;
    module?: string;
    sources?: FastGlobPattern[];
    include?: FastGlobPattern[];
    exclude?: FastGlobPattern[];
    includeClasses?: string[];
    excludeClasses?: string[] | RegExp[];
}
export default options;
