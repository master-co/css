import type { MasterCSSDiagnostic } from '@master/css-schema';
import type { MasterCSSManifest } from '@master/css-schema/manifest';
export interface MasterCSSVirtualManifestLoadResult {
    readonly manifest: MasterCSSManifest;
    readonly entries: readonly string[];
    readonly dependencies: readonly string[];
    readonly diagnostics: readonly MasterCSSDiagnostic[];
}
export interface MasterCSSVirtualManifestHost {
    readonly discoverManifestEntries: (options: {
        readonly root?: string;
        readonly signal?: AbortSignal;
    }) => Promise<readonly string[]>;
    readonly collectStylesheetDependencies: (entry: string, options: {
        readonly root?: string;
    }) => readonly string[];
    readonly loadProjectManifest: (options: {
        readonly root?: string;
        readonly entries: readonly string[];
        readonly baseManifest: MasterCSSManifest;
        readonly signal?: AbortSignal;
        readonly onDependency?: (dependency: string) => void;
    }) => Promise<MasterCSSVirtualManifestLoadResult>;
}
export interface MasterCSSVirtualManifestLoadOptions {
    readonly host: MasterCSSVirtualManifestHost;
    readonly root?: string;
    readonly entries?: readonly string[];
    readonly baseManifest?: MasterCSSManifest;
    readonly signal?: AbortSignal;
    readonly onDependency?: (dependency: string) => void;
}
export declare function loadMasterCSSVirtualManifest(options: MasterCSSVirtualManifestLoadOptions): Promise<MasterCSSVirtualManifestLoadResult>;
