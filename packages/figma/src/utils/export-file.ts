export default function exportFile(data: any, filename: string, type: string) {
    const blob = new Blob([JSON.stringify(data, null, 4)], { type: type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    return url
}