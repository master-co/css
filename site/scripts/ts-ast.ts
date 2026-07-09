import { resolve } from 'node:path'
import { API } from 'typescript/unstable/sync'
import type { Node, SourceFile } from 'typescript/unstable/ast'

export type { Node, SourceFile }

export function createTypeScriptASTHost(configFile: string) {
    const api = new API({ cwd: process.cwd() })
    const resolvedConfigFile = resolve(configFile)
    const snapshot = api.updateSnapshot({ openProjects: [resolvedConfigFile] })
    const project = snapshot.getProject(resolvedConfigFile)
    if (!project) {
        api.close()
        throw new Error(`Unable to open TypeScript project ${resolvedConfigFile}`)
    }
    return {
        getSourceFile(file: string): SourceFile {
            const resolvedFile = resolve(file)
            const sourceFile = project.program.getSourceFile(resolvedFile)
            if (!sourceFile) throw new Error(`Unable to read TypeScript source file ${resolvedFile}`)
            return sourceFile
        },
        close() {
            api.close()
        }
    }
}

export function visit(node: Node, callback: (node: Node) => void) {
    callback(node)
    node.forEachChild((child) => visit(child, callback))
}
