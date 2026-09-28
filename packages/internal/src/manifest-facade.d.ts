export declare const MANIFEST_MODULE_FILE = "master-css-manifest.js";
export declare const MANIFEST_ASSET_FILE = "master-css-manifest.json";
export declare const MASTER_CSS_MANIFEST_PRELOAD_REL = "modulepreload";
export declare const MASTER_CSS_MANIFEST_PRELOAD_AS = "json";
export interface ManifestPreloadLinkAttrs {
    rel: typeof MASTER_CSS_MANIFEST_PRELOAD_REL;
    as: typeof MASTER_CSS_MANIFEST_PRELOAD_AS;
    crossorigin: '';
    href: string;
}
export declare function toInlineManifestModule(json: string): string;
export declare function toManifestPreloadLinkAttrs(href: string): ManifestPreloadLinkAttrs;
export declare function toManifestPreloadLinkTag(href: string): string;
export declare function toBrowserManifestFacadeModule(urlExpression: string): string;
export declare function toNodeManifestFacadeModule(urlExpression: string): string;
export declare function toUniversalManifestFacadeModule(urlExpression: string): string;
