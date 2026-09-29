import type { MasterCSSManifest } from '@master/css-schema/manifest';
export type { MasterCSSManifest };
export declare const VIRTUAL_MANIFEST_ID = "virtual:master-css-manifest";
export declare const RESOLVED_VIRTUAL_MANIFEST_ID = "\0virtual:master-css-manifest";
export declare const MASTER_CSS_MANIFEST_QUERY = "?master-css-manifest";
export declare const VIRTUAL_MANIFEST_FILE = "master-css-manifest.js";
export declare const VIRTUAL_MANIFEST_ASSET_FILE = "master-css-manifest.json";
export declare const EMPTY_MANIFEST_JSON = "{\"version\":4,\"languageVersion\":10}";
export interface CSSManifestLoadResult {
    manifest: MasterCSSManifest;
    dependencies: string[];
    classNames?: string[];
    nativeClassNames?: string[];
    nativeCSS?: string;
    css?: string;
    generatedCSS?: string;
    warnings?: string[];
}
export type CSSManifestJSONResult = CSSManifestLoadResult & {
    json: string;
};
export declare function isMasterCSSManifestRequest(id: string): boolean;
export declare function stripMasterCSSManifestQuery(id: string): string;
export declare function stripResourceQuery(resourcePath: string): string;
export declare function toManifestJSON(manifest: MasterCSSManifest): string;
export declare function toManifestJSONResult<T extends CSSManifestLoadResult>(result: T): T & {
    json: string;
};
