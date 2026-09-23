/** Paint known authored boxes without supplying layout, sizing or positioning. */
export function paintLayout(source: string, prefix: string, inspected: string, measured = 'target') {
  return source.replace(/<([a-z]+)(\s[^>]*|)>/g, (tag: string, element: string, attributes: string) => {
    const id = attributes.match(/\bid="([\w-]+)"/)?.[1]
    if (!id || !/^(?:layout|target|peer|item-\d+)$/.test(id)) return tag
    const layout = id === 'layout'
    const tone = id === measured ? 'blue' : id === 'peer' || id === 'item-2' ? 'violet' : 'neutral'
    return `<${element}${attributes.replace(`id="${id}"`, `id="${prefix}${id}"`)} data-ui="${layout ? 'flex-layout' : 'flex-cell'}"${layout ? '' : ` data-tone="${tone}"`}${id === inspected ? ' data-target' : ''}>`
  })
}
