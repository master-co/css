import { type StandaloneCSSDirectiveStatement } from '../node-compiler';
import type { CSSDirectiveExtractionPolicy } from '@master/css-schema/css-directives';
export type StylesheetDirectives = CSSDirectiveExtractionPolicy;
export type StylesheetDirectiveStatement = StandaloneCSSDirectiveStatement;
export interface StylesheetSourceOptions {
    include?: readonly string[];
    exclude?: readonly string[];
    safelist?: readonly string[];
    blocklist?: readonly (string | RegExp)[];
}
export interface CollectedStylesheetDirectives {
    directives: StylesheetDirectives;
    dependencies: string[];
}
export declare function createStylesheetDirectives(): StylesheetDirectives;
export declare function hasStylesheetDirectives(directives?: StylesheetDirectives): boolean;
export declare function hasStylesheetSourceDirectives(directives?: StylesheetDirectives): boolean;
export declare function mergeStylesheetDirectives(...directives: (Partial<StylesheetDirectives> | undefined)[]): CSSDirectiveExtractionPolicy;
export declare function mergeStylesheetSourceOptions<T extends StylesheetSourceOptions>(options: T, directives?: StylesheetDirectives): T;
export declare function findStylesheetDirectiveStatements(source: string): StylesheetDirectiveStatement[];
export declare function removeStylesheetDirectiveStatements(source: string): {
    code: string;
    removed: boolean;
};
export declare function collectStylesheetDirectives(source: string, file?: string, cwd?: string): StylesheetDirectives;
export declare function collectStylesheetDirectivesFromCSSGraph(file: string, source?: string, cwd?: string): CollectedStylesheetDirectives;
export declare function resolveStylesheetSourcePaths(options: StylesheetSourceOptions, cwd?: string): string[];
