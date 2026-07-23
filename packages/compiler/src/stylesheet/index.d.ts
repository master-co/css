import { type CompileCSSOptions, type CompileCSSResult } from '../node-compiler';
import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals';
import type { MasterCSSManifest } from '@master/css-schema/manifest';
import { type RenderCompiledManifestCSSResult } from './render';
import { type StylesheetDirectives, type StylesheetSourceOptions } from './directives';
export { collectStylesheetDirectives, collectStylesheetDirectivesFromCSSGraph, createStylesheetDirectives, findStylesheetDirectiveStatements, hasStylesheetDirectives, hasStylesheetSourceDirectives, mergeStylesheetDirectives, mergeStylesheetSourceOptions, removeStylesheetDirectiveStatements, resolveStylesheetSourcePaths, type CollectedStylesheetDirectives, type StylesheetDirectiveStatement, type StylesheetDirectives, type StylesheetSourceOptions } from './directives';
export interface SassModule {
    compileStringAsync(source: string, options: {
        url: URL;
        style: 'expanded';
        syntax: 'scss' | 'indented';
    }): Promise<{
        css: string;
    }>;
}
export interface CompileStylesheetOptions extends CompileCSSOptions {
    baseManifest?: MasterCSSManifest;
    projectDir?: string;
    loadSass?: (projectDir?: string) => SassModule;
}
export interface CompileRenderedStylesheetResult extends CompileCSSResult {
    emittedGlobals: Required<MasterCSSEmittedGlobals>;
    manifest: MasterCSSManifest;
    renderedCSS: RenderCompiledManifestCSSResult;
}
export interface TransformLocalStylesheetResult {
    code: string;
    dependencies: string[];
    transformed: boolean;
    result?: CompileCSSResult;
}
export interface TransformLocalStylesheetOptions extends CompileStylesheetOptions {
    emittedGlobals?: MasterCSSEmittedGlobals;
}
export type RegisterStylesheetSourceOptions = CompileStylesheetOptions;
export type CreateStyleEntryEmittedGlobalsOptions = CompileStylesheetOptions;
export interface CreateStyleEntryEmittedGlobalsResult {
    emittedGlobals: Required<MasterCSSEmittedGlobals>;
    dependencies: string[];
}
export interface CreateExtractedCSSOptions extends CompileStylesheetOptions {
    scanner: ScannerState;
    stylesheetSources?: StylesheetSources;
    manifest?: MasterCSSManifest;
    includeGeneratedCSS?: boolean;
    includeNativeCSS?: boolean;
    includeMasterBaseCSS?: boolean;
}
export interface CreateExtractedCSSResult {
    css: string;
    emittedGlobals: Required<MasterCSSEmittedGlobals>;
}
export interface ScannerCSSState {
    readonly text: string;
    readonly manifest: MasterCSSManifest;
}
export interface ScannerClassState extends Iterable<string> {
    readonly size: number;
    has(className: string): boolean;
}
export interface ScannerState {
    cwd: string;
    options: StylesheetSourceOptions;
    customOptions?: {
        manifest?: MasterCSSManifest;
    };
    css: ScannerCSSState;
    latentClasses: ScannerClassState;
    validClasses: ScannerClassState;
    usedNativeClasses: ScannerClassState;
    nativeClassNames: ScannerClassState;
    registerNativeClasses?: (classNames: string[]) => boolean;
    emit?: (event: 'change') => unknown;
}
export interface StylesheetSource {
    source: string;
    pruneNativeCSS: boolean;
    masterCSS: boolean;
    directives: StylesheetDirectives;
    dependencies: string[];
    sourceDependencies: string[];
}
export type StylesheetSources = Map<string, StylesheetSource>;
export interface ResolvedStylesheetSource {
    source: string;
    dependencies: string[];
}
export interface ResolveStylesheetImportGraphOptions {
    expandMasterCSSPackage?: boolean;
}
export interface CreateStylesheetHostSourceOptions {
    masterImport?: string;
    masterSource?: string;
}
export declare function cleanStyleRequest(id: string): string;
export declare function isStylesheetRequest(id: string): boolean;
export declare function replaceStylesheetImports(source: string, replacement: string): {
    code: string;
    replaced: boolean;
};
export declare function resolveStylesheetImportGraph(file: string, source: string, projectDir?: string, options?: ResolveStylesheetImportGraphOptions): ResolvedStylesheetSource;
export declare function collectStylesheetDependencies(file: string, source?: string, projectDir?: string): string[];
export declare function removeStylesheetImports(source: string): {
    code: string;
    replaced: boolean;
};
export declare function hasStylesheetImport(source: string): boolean;
export declare function hasDefaultStylesheetImport(source: string): boolean;
export declare function hasMasterStyleEntrypoint(source: string): boolean;
export declare function resolveMasterStyleSource(file: string, source: string, projectDir?: string): ResolvedStylesheetSource | undefined;
export declare function isMasterCSSModuleId(id: string): boolean;
export declare function isMasterCSSPackageStyleFile(id: string, projectDir?: string): boolean;
export declare function removeMasterStyleDirectives(source: string): {
    code: string;
    removed: boolean;
};
export declare function hasLocalStyleDirectives(source: string): boolean;
export declare function createStylesheetHostSource(source: string, options?: CreateStylesheetHostSourceOptions): string;
export declare function createMasterCSSPackageHostSource(projectDir: string | undefined, options?: CompileStylesheetOptions): Promise<{
    source: string;
    dependencies: string[];
}>;
export declare function hasMasterEntryDirective(source: string): boolean;
export declare function hasPreserveNativeDirective(source: string): boolean;
export declare function isMasterStyleSource(source: string): boolean;
export declare function preprocessStylesheet(source: string, id: string, options?: CompileStylesheetOptions): Promise<string>;
export declare function compileStylesheet(id: string, source: string, options?: CompileStylesheetOptions): Promise<CompileCSSResult>;
export declare function compileRenderedStylesheet(id: string, source: string, options?: CompileStylesheetOptions): Promise<CompileRenderedStylesheetResult>;
export declare function compileLocalStylesheet(id: string, source: string, options?: CompileStylesheetOptions): Promise<CompileCSSResult>;
export declare function createStyleEntryEmittedGlobals(entries: string[], options?: CreateStyleEntryEmittedGlobalsOptions): Promise<CreateStyleEntryEmittedGlobalsResult>;
export declare function transformLocalStylesheet(id: string, source: string, options?: TransformLocalStylesheetOptions): Promise<TransformLocalStylesheetResult>;
export declare function getNativeCSS(result: {
    css?: string;
    generatedCSS?: string;
    nativeCSS?: string;
}): string;
export declare function getScannerClasses(scanner: ScannerState): string[];
export declare function refreshScannerNativeClasses(scanner: ScannerState, nativeClassNames: string[]): void;
export declare function registerStylesheetSource(scanner: ScannerState, stylesheetSources: StylesheetSources, id: string, source: string, options?: RegisterStylesheetSourceOptions): Promise<import("~/packages/schema/src/css-directives").CSSDirectiveResult>;
export interface CreateStylesheetManifestOptions extends CompileStylesheetOptions {
    stylesheetSources?: StylesheetSources;
}
export declare function createStylesheetManifest(options?: CreateStylesheetManifestOptions): Promise<{
    manifest: MasterCSSManifest | undefined;
    dependencies: string[];
}>;
export declare function createExtractedCSSResult(options: CreateExtractedCSSOptions): Promise<CreateExtractedCSSResult>;
export declare function createExtractedCSS(options: CreateExtractedCSSOptions): Promise<string>;
