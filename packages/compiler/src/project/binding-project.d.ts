import type { CSSDirectiveExtractionPolicy } from '@master/css-schema/css-directives';
import type { MasterCSSManifest } from '@master/css-schema/manifest';
interface BindingProjectSourceEntryPlan {
    entry: string;
    include: string[];
    exclude: string[];
    files: string[];
}
interface BindingProjectManifestResult {
    entries: string[];
    manifest: MasterCSSManifest;
    dependencies: string[];
    extractionPolicy: CSSDirectiveExtractionPolicy;
    classNames: string[];
    nativeClassNames: string[];
    nativeCSS: string;
    css: string;
    generatedCSS: string;
    warnings: string[];
    sourcePlan: {
        version: 1;
        entries: BindingProjectSourceEntryPlan[];
        files: string[];
    };
}
export declare function loadBindingProjectManifest(projectDir: string, baseManifest: MasterCSSManifest, entries?: readonly string[], onDependency?: (file: string) => void): BindingProjectManifestResult;
export {};
