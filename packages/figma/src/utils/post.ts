export default function post(type: string, data?: any) {
    parent.postMessage({ pluginMessage: { type, data: data !== undefined ? JSON.parse(JSON.stringify(data)) : {} } }, '*')
}
