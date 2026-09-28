export declare const MASTER_CSS_RUNTIME_BOOTSTRAP_ID = "virtual:master-css-runtime";
export declare const RESOLVED_MASTER_CSS_RUNTIME_BOOTSTRAP_ID = "\0virtual:master-css-runtime";
export declare function createMasterCSSRuntimeBootstrapSource(): string;
/** Resolve the public delivery contract before any adapter injects code. */
export declare function resolveIntegrationRuntime(mode: import('@master/css-schema/integration').MasterCSSRenderingMode, runtime: boolean | import('@master/css-schema/integration').MasterCSSIntegrationRuntimeOptions | undefined): {
    avoidFOUC?: boolean;
    enabled: boolean;
};
