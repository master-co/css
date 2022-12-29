if (process.env.INIT_CWD === process.cwd()) {
    process.exit()
}

const path = require('path')
const fs = require('fs')

const projectPath = path.resolve(process.cwd(), '../..')
if (!fs.existsSync(path.join(projectPath, 'master.css.js'))) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(projectPath, 'package.json')))
        let data = `/** @type {import('@master/css').Config} */\n`
        if (packageJson.type === 'module') {
            data += 'export default {\n}'
        } else {
            data += 'module.exports = {\n}'
        }
        fs.writeFileSync(path.join(projectPath, 'master.css.js'), data)
    } catch (_) {
        /* empty */
    }
}