import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals';
import type { MasterCSSManifest } from '@master/css-schema/manifest';
import type { MasterCSSNativeDeclarationCandidateIR, MasterCSSServerRenderIR } from '@master/css-backend/compiler';
export interface RenderCompiledManifestCSSOptions {
    manifest: MasterCSSManifest;
    classNames?: Iterable<string>;
    nativeCSS?: string | string[];
    includeGeneratedCSS?: boolean;
    emittedGlobals?: MasterCSSEmittedGlobals;
}
export interface RenderCompiledManifestCSSResult {
    css: string;
    nativeCSS: string;
    generatedCSS: string;
    emittedGlobals: Required<MasterCSSEmittedGlobals>;
}
export interface StylesheetRenderSession {
    nativeDeclarationCandidates(classNames: string[]): MasterCSSNativeDeclarationCandidateIR[];
    ensureClasses(classNames: string[], nativeSupport?: boolean[]): void;
    ensureStylesheetResources(nativeCSS: string): void;
    emittedGlobals(): Required<MasterCSSEmittedGlobals>;
    snapshot(): MasterCSSServerRenderIR;
    dispose(): void;
}
export declare function normalizeNativeCSS(nativeCSS: string | string[] | undefined): string[];
export declare function renderCompiledManifestCSSWithSession(options: RenderCompiledManifestCSSOptions, session: StylesheetRenderSession): RenderCompiledManifestCSSResult;
