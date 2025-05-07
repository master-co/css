export default function post(type: string, data?: any) {
    parent.postMessage({ pluginMessage: { type, data } }, '*')
}
