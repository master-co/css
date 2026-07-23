import type { CSSDirectiveExtractionPolicy, CSSDirectiveReference, CSSDirectiveResult } from '@master/css-schema/css-directives';
import type { MasterCSSDiagnostic } from '@master/css-schema';
export interface CompileCSSOptions {
    readonly classes?: readonly string[];
    readonly from?: string;
    readonly preserveNativeCSS?: boolean;
    readonly onDiagnostic?: (diagnostic: MasterCSSDiagnostic) => void;
}
export interface CompileCSSFileOptions extends CompileCSSOptions {
    root?: string;
}
export type CompileCSSResult = CSSDirectiveResult;
export interface ResolvedCSSImportGraph {
    source: string;
    dependencies: string[];
    references?: CSSDirectiveReference[];
}
export type CSSReferenceStatement = CSSDirectiveReference & {
    start: number;
    end: number;
    statement: string;
};
export declare function emptyExtractionPolicy(): CSSDirectiveExtractionPolicy;
