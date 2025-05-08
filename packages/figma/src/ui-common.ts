// @ts-expect-error es
import { reactive } from 'petite-vue'
import post from './utils/post'

export const states = reactive({
    selectedVarCollection: null,
    currentAction: null,
    varCollections: [],
    varOutputIndent: 4,
    copyVariables: () => {
        states.currentAction = 'copy-variables'
        post('get-collection-variables', { id: states.selectedVarCollection.id })
    },
    exportVariables: () => {
        states.currentAction = 'export-variables'
        post('get-collection-variables', { id: states.selectedVarCollection.id })
    }
})
