import chokidar from 'chokidar'
import fs from 'fs'
import fg from 'fast-glob'
import { program } from 'commander'

program.command('build', { isDefault: true })
    .allowUnknownOption()
    .option('-w, --watch', 'Watch file changed and generate CSS rules.')
    .option('-o, --output <path>', 'Specific your master CSS file output path', 'master.css')
    .action(async function ({ watch, output }) {
        console.log(watch, output)
        const compiler = await new (await import('@master/css-compiler')).default().compile()
        const insert = (path: string) => compiler.insert(path, fs.readFileSync(path, { encoding: 'utf-8' }))
        const write = () => fs.writeFileSync(output, compiler.css.text)
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
    })