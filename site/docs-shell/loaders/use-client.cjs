/** @type {(params: { source: string, context: string }) => { code: string }} */
module.exports = function useClient(source) {
  return '"use client";\n' + source
}
