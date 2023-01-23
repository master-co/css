import MasterCssCompiler from '@master/css-compiler'
import chokidar from 'chokidar'
import fs from 'fs'

export async function watch() {
    try {
        const compiler = new MasterCssCompiler() 
        await compiler.init()

        const output = compiler.options.output ?? 'master.css'

        const waching = (watcher: chokidar.FSWatcher) => {
            const handle = (path: string) => {
                compiler.insert(path, fs.readFileSync(path, { encoding: 'utf-8' }))
                fs.writeFileSync(output, compiler.css.text)
            }

            watcher
                .on('add', handle)
                .on('change', handle)
        }
        waching(
            chokidar.watch(compiler.options.include?.length ? compiler.options.include : '.', {
                ignored: compiler.options.exclude
            })
        )
        if (compiler.sources?.length) {
            waching(
                chokidar.watch(compiler.sources)
            )
        }
    } catch (ex) {
        console.log(ex)
    }
}
