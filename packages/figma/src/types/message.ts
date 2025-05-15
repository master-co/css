import { GetCollectionVariablesOptions } from '../features/getCollectionVariables'
import { SetCollectionVariablesOptions } from '../features/setCollectionVariables'

export type PluginMessage =
    | { type: 'getVariableCollections'; data: any }
    | { type: 'getCollectionVariables'; data: GetCollectionVariablesOptions }
    | { type: 'setCollectionVariables'; data: SetCollectionVariablesOptions }

export type PluginMessageMap = {
    [M in PluginMessage as M['type']]: M['data']
}