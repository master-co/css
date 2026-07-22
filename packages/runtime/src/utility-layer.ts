import RuntimeLayer from './layer'

/**
 * CSSOM host state for one generated utility layer. Class matching, ordering,
 * resources, and lifecycle are owned by the Rust engine session.
 */
export default class RuntimeUtilityLayer extends RuntimeLayer { }

export declare type RuntimeUtilityLayerInstance = RuntimeUtilityLayer
