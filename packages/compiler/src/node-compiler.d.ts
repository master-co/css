import type { MasterCSSManifest } from '@master/css-schema/manifest';
import type { CSSDirectiveExtractionPolicy } from '@master/css-schema/css-directives';
import { type CompileCSSOptions, type CSSReferenceStatement, type CompileCSSFileOptions, type CompileCSSResult, type ResolvedCSSImportGraph } from './contracts';
export type { CompileCSSFileOptions, CompileCSSOptions, CompileCSSResult, CSSReferenceStatement, ResolvedCSSImportGraph } from './contracts';
export interface CSSDependencyImport {
    start: number;
    end: number;
    statement: string;
    source: string;
}
export interface CSSDependencyAnalysis {
    sourceWithoutReferences: string;
    imports: CSSDependencyImport[];
}
export interface InspectCSSResult {
    hasMasterEntryDirective: boolean;
    hasMasterCSSImport: boolean;
    hasMasterEntry: boolean;
    directives: {
        name: string;
        range: {
            start: number;
            end: number;
        };
        preludeRange: {
            start: number;
            end: number;
        };
        hasBlock: boolean;
        quotedStrings: number;
    }[];
}
export interface ResolveCSSImportGraphOptions {
    projectDir?: string;
    expandPackageImports?: boolean;
    onReference?: (reference: CSSReferenceStatement, fromFile: string) => void;
}
export type CompileCSSManifestOptions = CompileCSSFileOptions & {
    baseManifest?: MasterCSSManifest;
};
export type CompileCSSManifestSourceOptions = CompileCSSOptions & {
    baseManifest?: MasterCSSManifest;
    root?: string;
};
export interface CompileCSSManifestResult extends Omit<CompileCSSResult, 'manifestInput'> {
    manifest: MasterCSSManifest;
    resolutionManifest: MasterCSSManifest;
    directives: CompileCSSResult;
}
export interface CompileProjectManifestResult extends CompileCSSManifestResult {
    entries: string[];
}
export type CompileCSSManifestJSONResult = CompileCSSManifestResult & {
    json: string;
    directives: CompileCSSResult;
};
export declare class CSSCompilerError extends Error {
    readonly code: string;
    readonly source?: string;
    readonly range?: {
        start: number;
        end: number;
    };
    readonly notes?: string[];
    constructor(code: string, message: string, diagnostic?: {
        source?: string;
        range?: {
            start: number;
            end: number;
        };
        notes?: string[];
    }, options?: ErrorOptions);
}
export declare function resolveMasterCSSPackageEntryFile(importSource: string, fromFile?: string, projectDir?: string): string | undefined;
export declare function inspectCSS(source: string): InspectCSSResult;
export declare function resolveCSSImportGraph(file: string, options?: ResolveCSSImportGraphOptions): ResolvedCSSImportGraph;
export declare function resolveCSSImportGraphSource(file: string, source: string | undefined, options?: ResolveCSSImportGraphOptions): ResolvedCSSImportGraph;
export declare function analyzeCSSDependencies(source: string): CSSDependencyAnalysis;
export declare function resolveMasterCSSPackageImportGraph(projectDir?: string): ResolvedCSSImportGraph;
export declare function isMasterCSSPackageStyleFile(id: string, projectDir?: string): boolean;
export declare function compileCSSFile(file: string, options?: CompileCSSFileOptions): CompileCSSResult;
export declare function compileCSS(source: string, options?: CompileCSSOptions): CompileCSSResult;
export declare function filterCSSExtractionCandidates(candidates: string[], blocklist?: Iterable<string | RegExp>): string[];
export declare function mergeCSSDirectiveExtractionPolicy(...policies: (Partial<CSSDirectiveExtractionPolicy> | undefined)[]): CSSDirectiveExtractionPolicy;
export declare function createCSSDirectiveExtractionPolicy(): CSSDirectiveExtractionPolicy;
export interface StandaloneCSSDirectiveStatement {
    start: number;
    end: number;
    atRuleName: 'master' | 'source' | 'safelist' | 'blocklist' | 'preserve';
    name: string;
    statement: string;
    args: string[];
    modifiers: string[];
}
export type StandaloneMasterDirectiveStatement = StandaloneCSSDirectiveStatement & {
    atRuleName: 'master';
};
export declare function findStandaloneCSSDirectiveStatements(source: string): StandaloneCSSDirectiveStatement[];
export declare function findStandaloneMasterDirectiveStatements(source: string): StandaloneMasterDirectiveStatement[];
export declare function collectStandaloneCSSDirectiveExtractionPolicy(source: string): CSSDirectiveExtractionPolicy;
export declare function removeStandaloneCSSDirectives(source: string): string;
export declare function removeStandaloneMasterDirectives(source: string): string;
export declare function createManifestFromCSSResult(result: CompileCSSResult, options?: CompileCSSManifestSourceOptions): CompileCSSManifestResult;
export declare function compileCSSManifest(source: string, options?: CompileCSSManifestSourceOptions): CompileCSSManifestResult;
export declare function compileCSSManifestFile(file: string, options?: CompileCSSManifestOptions): CompileCSSManifestResult;
export declare function compileProjectManifest(entries: string[], options?: CompileCSSManifestOptions): CompileProjectManifestResult;
export declare function compileCSSManifestJSON(file: string, options?: CompileCSSManifestOptions): CompileCSSManifestJSONResult;
export declare function compileProjectManifestJSON(entries: string[], options?: CompileCSSManifestOptions): CompileProjectManifestResult & {
    json: string;
};
