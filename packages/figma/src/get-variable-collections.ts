export default async function getVariableCollections() {
    const collections = await figma.variables.getLocalVariableCollectionsAsync()
    const result = collections.map((c) => ({
        id: c.id,
        name: c.name
    }))
    return result
}