import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './main.scss'
import notify from './utils/notify'
import post from './utils/post'
import postAndWaitForMessage from './utils/post-and-wait-for-message'
import usePluginMessage from './hooks/use-plugin-message'

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

    const [isProcessing, setIsProcessing] = useState(false)

    usePluginMessage<VariableCollection[]>('get-variable-collections', (data) => {
        setVarCollections(data)
        if (data.length > 0) {
            setSelectedImportVarCollection(data[0])
        }
    })

    useEffect(() => {
        post('get-variable-collections')
    }, [])

    const importVarJSON = async () => {
        if (isProcessing) return
        setIsProcessing(true)

        try {
            let parsedJSON: any
            if (inputedVarJSONStr?.trim()) {
                try {
                    parsedJSON = JSON.parse(inputedVarJSONStr)
                } catch (e) {
                    notify('Invalid JSON format', { error: true })
                    return
                }
            } else {
                parsedJSON = JSON.parse(DEFAULT_INPUTED_VAR_JSON_STR)
            }

            await postAndWaitForMessage<'ok'>('set-collection-variables', {
                collectionId: selectedImportVarCollection?.id,
                inputedVarCollectionName: inputedVarCollectionName || DEFAULT_INPUTED_VAR_COLLECTION_NAME,
                inputedVarJSON: parsedJSON,
            })

            notify('Import succeeded')
        } catch (err: any) {
            notify(err.message || 'Import failed', { error: true })
        } finally {
            setIsProcessing(false)
        }
    }

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

                <button onClick={importVarJSON} disabled={isProcessing}>
                    {isProcessing ? 'Importing...' : 'Import'}
                </button>
            </div>
        </section>
    )
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ImportVariables />
    </StrictMode>
)
