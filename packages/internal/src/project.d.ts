import type { MasterCSSManifest } from '@master/css-schema/manifest';
export declare const defaultBuildManifest: Readonly<MasterCSSManifest>;
export declare function createManifestEntryPattern(): RegExp;
export declare function cleanManifestStylesheetRequest(id: string): string;
export declare function isManifestStylesheetRequest(id: string): boolean;
