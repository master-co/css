export default function normalizeDefinitionName(name: string) {
    const trimmed = name.trim()
    return trimmed.startsWith('.') ? trimmed.slice(1) : trimmed
}
