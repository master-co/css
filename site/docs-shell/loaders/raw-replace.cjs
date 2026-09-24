const fs = require('fs')
const path = require('path')

/** @type {(params: { source: string, context: string }) => { code: string }} */
module.exports = function rawReplace(source) {
  const dir = path.dirname(this.resourcePath)
  const code = source.replace(
    /require\(['"](.+?\.(html|css|js|tsx|ts))\?raw['"]\)/g,
    (match, filePath) => {
      const absolutePath = path.resolve(dir, filePath)
      if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${absolutePath}`)
      }
      const rawContent = fs.readFileSync(absolutePath, 'utf-8')
      this.cacheable(false)
      return JSON.stringify(rawContent)
    }
  )
  return code
}
