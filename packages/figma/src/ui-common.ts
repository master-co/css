// @ts-expect-error es
import { reactive } from 'petite-vue'
import post from './utils/post'

export const states = reactive({
    selectedVarCollection: null,
    selectedVarDefaultMode: null,
    selectedVarColorSpace: 'hex',
    currentAction: null,
    varCollections: [],
    varOutputIndent: 4,
    copyVariables: () => {
        states.currentAction = 'copy-variables'
        post('get-collection-variables', { id: states.selectedVarCollection.id, selectedVarDefaultMode: states.selectedVarDefaultMode, selectedVarColorSpace: states.selectedVarColorSpace })
    },
    exportVariables: () => {
        states.currentAction = 'export-variables'
        post('get-collection-variables', { id: states.selectedVarCollection.id, selectedVarDefaultMode: states.selectedVarDefaultMode, selectedVarColorSpace: states.selectedVarColorSpace })
    },
    varCollectionChange: () => {
        states.selectedVarDefaultMode = states.selectedVarCollection?.modes.find(({ name }: any) => ['Default', 'default', 'Value', 'value', '預設', '默认'].includes(name)) || null
    }
})

