export default async function getVariableCollections() {
    const collections = await figma.variables.getLocalVariableCollectionsAsync()
    const result = collections.map((c) => ({
        id: c.id,
        name: c.name,
        modes: c.modes.map((m) => ({
            id: m.modeId,
            name: m.name,
        }))
    }))
    return result
}