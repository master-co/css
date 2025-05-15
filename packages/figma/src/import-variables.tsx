import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './main.scss'
import post from './utils/post'
import notify from './utils/notify'

interface VariableCollection {
    id: string
    name: string
}

const DEFAULT_INPUTED_VAR_JSON_STR = `{
    "variables": { "primary": "#ff0000" },
    "modes": {
        "light": { "primary": "#ffffff" },
        "dark": { "primary": "#000000" }
    }
}`

const DEFAULT_INPUTED_VAR_COLLECTION_NAME = 'My Collection'

function ImportVariables() {
    const [varCollections, setVarCollections] = useState<VariableCollection[]>([])
    const [selectedImportVarCollection, setSelectedImportVarCollection] = useState<VariableCollection | null>(null)
    const [inputedVarJSONStr, setInputedVarJSONStr] = useState<string | null>(null)
    const [inputedVarCollectionName, setInputedVarCollectionName] = useState('')

    const importVarJSON = () => {
        let inputedVarJSON: any

        if (inputedVarJSONStr) {
            try {
                inputedVarJSON = JSON.parse(inputedVarJSONStr)
            } catch (e) {
                console.error(e)
                notify('Invalid JSON format', { error: true })
                return
            }
        } else {
            inputedVarJSON = JSON.parse(DEFAULT_INPUTED_VAR_JSON_STR)
        }

        post('set-collection-variables', {
            collectionId: selectedImportVarCollection?.id,
            inputedVarCollectionName: inputedVarCollectionName || DEFAULT_INPUTED_VAR_COLLECTION_NAME,
            inputedVarJSON,
        })
    }

    useEffect(() => {
        const handler = (event: MessageEvent<{ pluginMessage: { type: string; data: any } }>) => {
            const { type, data } = event.data.pluginMessage
            if (type === 'get-variable-collections') {
                setVarCollections(data)
                if (data.length > 0) {
                    setSelectedImportVarCollection(data[0])
                }
            }
        }
        window.addEventListener('message', handler)
        post('get-variable-collections')
        return () => window.removeEventListener('message', handler)
    }, [])

    return (
        <section>
            <div className="panel-rows">
                <textarea
                    id="var-input-json"
                    value={inputedVarJSONStr ?? ''}
                    onChange={(e) => setInputedVarJSONStr(e.target.value)}
                    placeholder={DEFAULT_INPUTED_VAR_JSON_STR}
                    rows={7}
                ></textarea>

                <div className="panel-prop">
                    <label htmlFor="input-var-collections">Collection:</label>
                    <select
                        id="input-var-collections"
                        value={selectedImportVarCollection?.id ?? ''}
                        onChange={(e) => {
                            const found = varCollections.find((v) => v.id === e.target.value)
                            setSelectedImportVarCollection(found ?? null)
                        }}
                    >
                        <option value="">New</option>
                        {varCollections.map((varCollection) => (
                            <option key={varCollection.id} value={varCollection.id}>
                                {varCollection.name}
                            </option>
                        ))}
                    </select>
                </div>

                {!selectedImportVarCollection && (
                    <div className="panel-prop">
                        <label htmlFor="input-var-collection-name">Collection Name:</label>
                        <input
                            id="input-var-collection-name"
                            type="text"
                            value={inputedVarCollectionName}
                            onChange={(e) => setInputedVarCollectionName(e.target.value)}
                            placeholder={DEFAULT_INPUTED_VAR_COLLECTION_NAME}
                        />
                    </div>
                )}

                <button onClick={importVarJSON}>Import</button>
            </div>
        </section>
    )
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ImportVariables />
    </StrictMode>,
)
