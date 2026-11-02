/** A Vite module id without its query or hash. */
export function cleanId(id: string) {
  return id.replace(/[?#].*$/, '')
}
