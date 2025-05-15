// @ts-expect-error es
import { createApp, reactive } from 'petite-vue'
import './main.scss'
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

const states = reactive({
    DEFAULT_INPUTED_VAR_JSON_STR,
    DEFAULT_INPUTED_VAR_COLLECTION_NAME,
    selectedVarCollection: null,
    selectedImportVarCollection: null,
    inputedVarJSONStr: null,
    inputedVarCollectionName: '',
    // other
    currentAction: null,
    varCollections: [],
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

window.onmessage = (event) => {
    const { type, data } = event.data.pluginMessage
    switch (type) {
        case 'get-variable-collections':
            states.varCollections = data
            states.selectedVarCollection = data[0]
            break
    }
}

createApp(states).mount()

post('get-variable-collections')
