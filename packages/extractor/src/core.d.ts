import { Options } from './options';
import { MasterCSS } from '@master/css';
import type { Config } from '@master/css';
import { type ChokidarOptions, type FSWatcher } from 'chokidar';
import { EventEmitter } from 'node:events';
import { Stats } from 'node:fs';
export default class CSSExtractor extends EventEmitter {
    customOptions: Options | string;
    cwd: string;
    latentClasses: Set<string>;
    validClasses: Set<string>;
    invalidClasses: Set<string>;
    watching: boolean;
    watchers: FSWatcher[];
    initialized: boolean;
    constructor(customOptions?: Options | string, cwd?: string);
    init(customOptions?: string | Options): this | undefined;
    reset(customOptions?: string | Options): Promise<this>;
    destroy(): Promise<this>;
    prepare(): Promise<void>;
    /**
     * @description Filter based on relative file paths and extract content
     * @param source
     * @param content
     * @returns string[] Latent classes
     */
    extract(source: string, content: string): string[];
    /**
     * @description Filter based on relative file paths, extract content, and insert
     * @param source
     * @param content
     * @returns string[] Latent classes
     */
    insert(source: string, content: string): Promise<boolean>;
    insertFile(source: string): Promise<boolean>;
    insertFiles(sources: string[]): Promise<boolean[]>;
    export(filename?: string): void;
    watchSource(paths: string | string[], watchOptions?: ChokidarOptions): Promise<void>;
    watch(events: string, paths: string | string[], handle: (path: string, stats?: Stats | undefined) => void, watchOptions?: ChokidarOptions): Promise<void>;
    startWatch(options?: {
        emit?: boolean;
    }): Promise<void>;
    closeWatch(options?: {
        emit?: boolean;
    }): Promise<void>;
    /**
     * computed from `options.sources`
     */
    get fixedSourcePaths(): string[];
    /**
     * resolved from `fixedSourcePaths`
     */
    get resolvedFixedSourcePaths(): string[];
    /**
     * `options.include` - `options.exclude`
     */
    get allowedSourcePaths(): string[];
    /**
     * resolved from `allowedSourcePaths`
     */
    get resolvedAllowedSourcePaths(): string[];
    isSourceAllowed(source: string): boolean;
    /**
     * computed from `options.config`
     */
    get config(): Config;
    /**
     * computed from string `options.config`
    */
    get configPath(): string | undefined;
    /**
     * computed from string `options.config`
    */
    get resolvedConfigPath(): string | undefined;
    /**
     * computed from string `customOptions`
    */
    get optionsPath(): string | undefined;
    /**
     * computed from string `customOptions`
    */
    get resolvedOptionsPath(): string | undefined;
    get resolvedVirtualModuleId(): string;
    get slotCSSRule(): string;
}
export default interface CSSExtractor {
    css: MasterCSS;
    options: Options;
}
