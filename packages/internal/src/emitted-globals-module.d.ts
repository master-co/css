import type { MasterCSSEmittedGlobals } from '@master/css-schema/emitted-globals';
export type { MasterCSSEmittedGlobals };
export declare const VIRTUAL_EMITTED_GLOBALS_ID = "virtual:master-css-emitted-globals";
export declare const VIRTUAL_EMITTED_GLOBALS_FILE = "master-css-emitted-globals.js";
export declare const EMPTY_EMITTED_GLOBALS_MODULE = "export default { variables: {}, keyframes: {} };";
export declare function normalizeEmittedGlobals(emittedGlobals?: MasterCSSEmittedGlobals): Required<MasterCSSEmittedGlobals>;
export declare function toEmittedGlobalsModule(emittedGlobals: MasterCSSEmittedGlobals): string;
