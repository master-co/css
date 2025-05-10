// @ts-expect-error es
import { reactive } from 'petite-vue'
import post from './utils/post'
import notify from './utils/notify'

const DEFAULT_INPUTED_VAR_JSON_STR = `{
    "variables": { "primary": "#ff0000" },
    "modes": {
        "light": { "primary": "#ffffff" },
        "dark": { "primary": "#000000" }
    }
}`

const DEFAULT_INPUTED_VAR_COLLECTION_NAME = 'My Collection'

export const states = reactive({
    // export variables
    selectedVarCollection: null,
    selectedVarDefaultMode: null,
    selectedVarColorSpace: 'hex',
    varOutputIndent: 4,
    // import variables
    DEFAULT_INPUTED_VAR_JSON_STR,
    DEFAULT_INPUTED_VAR_COLLECTION_NAME,
    selectedImportVarCollection: null,
    inputedVarJSONStr: null,
    inputedVarCollectionName: '',
    // other
    currentAction: null,
    varCollections: [],
    copyVariables: () => {
        states.currentAction = 'copy-variables'
        post('get-collection-variables', { collectionId: states.selectedVarCollection.id, selectedVarDefaultMode: states.selectedVarDefaultMode, selectedVarColorSpace: states.selectedVarColorSpace })
    },
    exportVariables: () => {
        states.currentAction = 'export-variables'
        post('get-collection-variables', { collectionId: states.selectedVarCollection.id, selectedVarDefaultMode: states.selectedVarDefaultMode, selectedVarColorSpace: states.selectedVarColorSpace })
    },
    varCollectionChange: () => {
        if (states.selectedVarCollection?.modes.length === 1) {
            states.selectedVarDefaultMode = states.selectedVarCollection.modes[0]
        } else {
            states.selectedVarDefaultMode = states.selectedVarCollection?.modes.find(({ name }: any) => ['Default', 'default', 'Value', 'value', '預設', '默认'].includes(name)) || null
        }
    },
    importVarJSON: () => {
        let inputedVarJSON
        if (states.inputedVarJSONStr)
            try {
                inputedVarJSON = JSON.parse(states.inputedVarJSONStr)
            } catch (e) {
                console.error(e)
                notify('Invalid JSON format', { error: true })
                return
            }
        inputedVarJSON = inputedVarJSON || JSON.parse(DEFAULT_INPUTED_VAR_JSON_STR)
        post('set-collection-variables', {
            collectionId: states.selectedImportVarCollection?.id,
            inputedVarCollectionName: states.inputedVarCollectionName || DEFAULT_INPUTED_VAR_COLLECTION_NAME,
            inputedVarJSON,
        })
    }
})

