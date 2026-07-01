type OptionalPeerImporter = (specifier: string) => Promise<unknown>

const defaultImporter: OptionalPeerImporter = (specifier) => import(specifier)
const peerPromises = new Map<string, Promise<unknown | undefined>>()
const warnedPeers = new Set<string>()

let importer: OptionalPeerImporter = defaultImporter

export async function loadOptionalPeer<T>(specifier: string, label: string): Promise<T | undefined> {
    let peerPromise = peerPromises.get(specifier)
    if (!peerPromise) {
        peerPromise = importer(specifier).catch((error: unknown) => {
            if (!warnedPeers.has(specifier)) {
                warnedPeers.add(specifier)
                const message = error instanceof Error ? ` ${error.message}` : ''
                console.warn(`[@master/css-source] Optional ${label} parser "${specifier}" could not be loaded; falling back to text extraction.${message}`)
            }
            return undefined
        })
        peerPromises.set(specifier, peerPromise)
    }
    return await peerPromise as T | undefined
}

export function setOptionalPeerImporterForTest(nextImporter: OptionalPeerImporter) {
    importer = nextImporter
    peerPromises.clear()
}

export function resetOptionalPeerStateForTest() {
    importer = defaultImporter
    peerPromises.clear()
    warnedPeers.clear()
}
