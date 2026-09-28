export interface PrepareCSSImportGraphOptions {
    projectDir?: string;
    expandPackageImports?: boolean;
    onDependency?: (file: string) => void;
    resolveNodePackageImports?: boolean;
    signal?: AbortSignal;
    baseFile?: string;
    sourceMap?: string;
}
type AnalyzeDependencies = (source: string) => {
    imports: {
        source: string;
    }[];
};
/** Source supplied by a host loader; virtual IDs retain their null prefix. */
export interface CSSImportSource {
    readonly id: string;
    readonly source: string;
    /** Real source owner for relative imports, references, resource URLs and source patterns, if any. */
    readonly baseFile?: string;
    /** Serialized source map v3 for original reference origins in prepared CSS. */
    readonly sourceMap?: string;
}
/** undefined uses Node fallback; null preserves an external import verbatim. */
export type CSSImportFileResolver = (specifier: string, importer: string) => string | CSSImportSource | null | undefined | Promise<string | CSSImportSource | null | undefined>;
export declare function normalizeStylesheetGraphID(id: string): string;
export declare function isExpandableImportSource(source: string, fromFile: string): boolean;
export declare function resolveRelativeCSSFile(source: string, fromFile: string): string;
export declare function resolveMasterCSSPackageEntryFile(importSource: string, fromFile?: string, projectDir?: string): string | undefined;
export interface PreparedCSSImportGraph {
    entry: string;
    files: Record<string, string>;
    edges: {
        from: string;
        specifier: string;
        resolved: string;
    }[];
    /** Node package CSS keeps its native rules when a surrounding project is pruned. */
    packageFiles?: string[];
    baseFiles?: Record<string, string>;
    sourceMaps?: Record<string, string>;
}
export declare function resolveNodePackageCSS(importSource: string, fromFile: string): string | undefined;
export declare function prepareCSSImportGraph(file: string, source: string | undefined, options: PrepareCSSImportGraphOptions, analyzeDependencies: AnalyzeDependencies): PreparedCSSImportGraph;
/** Async build-host file resolution, sharing Node fallback and Rust dependency analysis. */
export declare function prepareCSSImportGraphWithResolver(file: string, source: string, options: PrepareCSSImportGraphOptions, analyzeDependencies: AnalyzeDependencies, resolveImport: CSSImportFileResolver): Promise<PreparedCSSImportGraph>;
export {};
