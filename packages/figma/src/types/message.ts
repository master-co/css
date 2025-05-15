export type PluginMessage =
    | { type: 'get-variable-collections'; data: any }
    | { type: 'get-collection-variables'; data: any }
    | { type: 'set-collection-variables'; data: any }