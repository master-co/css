import type { MasterCSSManifest } from '@master/css-schema/manifest';
import type { CSSDirectiveExtractionPolicy, CSSDirectiveReference, CSSUtilitySource } from '@master/css-schema/css-directives';
import { type CompilerDiagnosticRecorder } from './compiler-diagnostics';
import { type CompileCSSOptions, type CSSReferenceStatement, type CompileCSSFileOptions, type CompileCSSResult, type ResolvedCSSImportGraph } from './contracts';
import { type PreparedCSSImportGraph } from './node-imports';
export { resolveMasterCSSPackageEntryFile } from './node-imports';
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
    resources: {
        start: number;
        end: number;
        url: string;
    }[];
}
export interface InspectCSSResult {
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
    onDependency?: (file: string) => void;
    onSource?: (file: string, source: string) => void;
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
type CompileCSSManifestInternalOptions = CompileCSSManifestSourceOptions & {
    /** Host context definitions retain file URL owners until the host publishes assets. */
    resolveReferenceResources?: boolean;
    referenceResources?: boolean;
    referenceStack?: string[];
    diagnostics?: CompilerDiagnosticRecorder;
    sourceText?: string;
    onDependency?: (file: string) => void;
};
export interface CompileCSSManifestResult extends Omit<CompileCSSResult, 'manifestInput'> {
    sourceTexts?: Record<string, string>;
    manifest: MasterCSSManifest;
    resolutionManifest: MasterCSSManifest;
    directives: CompileCSSResult;
}
export interface CompileProjectManifestResult extends CompileCSSManifestResult {
    entries: string[];
}
export declare function inspectCSS(source: string): InspectCSSResult;
export declare function resolveCSSImportGraph(file: string, options?: ResolveCSSImportGraphOptions): ResolvedCSSImportGraph;
export declare function resolveCSSImportGraphSource(file: string, source: string | undefined, options?: ResolveCSSImportGraphOptions): ResolvedCSSImportGraph;
export declare function analyzeCSSDependencies(source: string): CSSDependencyAnalysis;
export declare function resolveMasterCSSPackageImportGraph(projectDir?: string): ResolvedCSSImportGraph;
export declare function stripRequestSuffix(id: string): string;
export declare function stripWindowsExtendedPathPrefix(file: string): string;
export declare function isMasterCSSPackageStyleFile(id: string, projectDir?: string): boolean;
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
export declare function findStandaloneCSSDirectiveStatements(source: string): StandaloneCSSDirectiveStatement[];
export declare function collectStandaloneCSSDirectiveExtractionPolicy(source: string): CSSDirectiveExtractionPolicy;
export declare function removeStandaloneCSSDirectives(source: string): string;
export declare function resolveCSSReferenceFile(reference: CSSDirectiveReference & {
    resolvedFile?: string;
}, options?: CompileCSSManifestSourceOptions): string;
/** Compile original files independently before merging their manifest and native output. */
export declare function compileCSSManifestGraph(graph: PreparedCSSImportGraph, options?: CompileCSSManifestInternalOptions & {
    mapReferences?: (file: string, source: string, references: CSSDirectiveReference[]) => readonly CSSDirectiveReference[];
}): {
    utilitySources?: CSSUtilitySource[];
    nativeOutput?: import("@master/css-schema/css-directives").CSSNativeOutput;
    sourceMap?: string;
    nativeMappings?: import("@master/css-schema/css-directives").CSSOutputMapping[];
    generatedMappings?: import("@master/css-schema/css-directives").CSSOutputMapping[];
    manifestInput: import("@master/css-schema/css-directives").CSSDirectiveManifestInput;
    extractionPolicy: CSSDirectiveExtractionPolicy;
    classNames: string[];
    nativeClassNames: string[];
    nativeCSS: string;
    generatedCSS: string;
    references?: CSSDirectiveReference[];
    styleDefinitions?: import("@master/css-schema/css-directives").CSSDirectiveStyleDefinition[];
    dependencies: string[];
    warnings: string[];
    css: string;
    outputMappings: import("@master/css-schema/css-directives").CSSOutputMapping[];
    sourceTexts: Record<string, string>;
    manifest: MasterCSSManifest;
    resolutionManifest: MasterCSSManifest;
    directives: import("@master/css-schema/css-directives").CSSDirectiveResult;
    stylesheets: import("@master/css-binding/protocol").MasterCSSCompiledStylesheet[];
};
export declare function createManifestFromCSSResult(result: CompileCSSResult, options?: CompileCSSManifestSourceOptions & {
    sourceText?: string;
    onDependency?: (file: string) => void;
    resolveReferenceResources?: boolean;
}): CompileCSSManifestResult;
export declare function compileCSSManifest(source: string, options?: CompileCSSManifestSourceOptions): CompileCSSManifestResult;
export declare function compileCSSManifestFile(file: string, options?: CompileCSSManifestOptions): CompileCSSManifestResult;
export declare function compileProjectManifest(entries: string[], options?: CompileCSSManifestOptions): CompileProjectManifestResult;
