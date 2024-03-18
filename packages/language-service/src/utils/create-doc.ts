import { TextDocument } from 'vscode-languageserver-textdocument'

const languageIdOfExt = {
    ts: 'typescript',
    tsx: 'typescriptreact',
    js: 'javascript',
    jsx: 'javascriptreact',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    json: 'json'
}

export default function createDoc(ext: keyof typeof languageIdOfExt, content: string) {
    return TextDocument.create(`file:///abc.${ext}`, languageIdOfExt[ext], 0, content)
}