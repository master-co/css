import chokidar from 'chokidar'
import fs from 'fs'
import fg from 'fast-glob'

export async function watch() {
    try {
        const { watch } = this.opts()
        const compiler = await new (await import('@master/css-compiler')).default().compile()

        const insert = (path: string) => compiler.insert(path, fs.readFileSync(path, { encoding: 'utf-8' }))
        const write = () => fs.writeFileSync(output, compiler.css.text)

        const output = compiler.options.output ?? 'master.css'

        if (watch) {
            const handle = (path: string) => {
                insert(path)
                write()
            }

            const waching = (watcher: chokidar.FSWatcher) => {
                watcher
                    .on('add', handle)
                    .on('change', handle)
            }
            waching(
                chokidar.watch(compiler.sources)
            )
        } else {
            const filePaths = fg.sync(compiler.sources)
            filePaths.forEach(insert)
            write()
        }
    } catch (ex) {
        console.log(ex)
    }
}
