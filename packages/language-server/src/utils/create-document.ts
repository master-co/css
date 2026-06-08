import { TextDocument } from 'vscode-languageserver-textdocument'
import { nanoid } from 'nanoid'
import path from 'path'
import { URI } from 'vscode-uri'

const extOfLang = {
    typescript: 'ts',
    typescriptreact: 'tsx',
    javascript: 'js',
    javascriptreact: 'jsx',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    json: 'json',
    vue: 'vue',
    svelte: 'svelte',
    astro: 'astro',
}

export default function createDocument(text: string, options?: { lang?: string, dir?: string }) {
    const lang = options?.lang || 'html'
    const dir = options?.dir || './'
    const filePath = path.join(dir, `${nanoid()}.${extOfLang[lang as keyof typeof extOfLang]}`)
    const fileURI = URI.file(filePath).toString()
    return TextDocument.create(fileURI, lang, 0, text)
}
