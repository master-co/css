import { type MasterCSSProjectCompileOptions, type MasterCSSProjectDiscoveryOptions, type MasterCSSProjectLoadOptions, type MasterCSSProjectResult } from './options';
export type { MasterCSSProjectCompileOptions, MasterCSSProjectDiscoveryOptions, MasterCSSProjectLoadOptions, MasterCSSProjectResult } from './options';
export declare function discoverManifestEntries(options?: MasterCSSProjectDiscoveryOptions): Promise<readonly string[]>;
export declare function loadProjectManifest(options: MasterCSSProjectLoadOptions): Promise<MasterCSSProjectResult>;
export declare function compileProjectManifest(options: MasterCSSProjectCompileOptions): Promise<MasterCSSProjectResult>;
